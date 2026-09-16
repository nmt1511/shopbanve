"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import { uploadDrawingImage } from "@/lib/shopbanve/media"
import type { Drawing, DrawingImage, ShopCategory } from "@/lib/shopbanve/types"
import { slugifyShopText } from "@/lib/shopbanve/validation"
import { useAuth } from "@/lib/firebase-auth"

export default function EditDrawingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [price, setPrice] = useState("0")
  const [priceType, setPriceType] = useState<"paid" | "free" | "contact">("contact")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [featured, setFeatured] = useState(false)
  const [images, setImages] = useState<DrawingImage[]>([])
  const [coverImageId, setCoverImageId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const uploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError("")
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadDrawingImage(file, user?.uid)),
      )
      setImages((current) => {
        const offset = current.length
        return [
          ...current,
          ...uploaded.map((image, index) => ({
            ...image,
            sortOrder: offset + index,
          })),
        ]
      })
      setCoverImageId((currentCover) => currentCover || uploaded[0]?.id || "")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  useEffect(() => {
    const id = params?.id
    if (!id) return

    Promise.all([
      ShopBanVeRepository.getDrawing(id),
      ShopBanVeRepository.getCategories(),
    ])
      .then(([item, categoryItems]) => {
        setCategories(categoryItems)
        if (!item) {
          setError("Không tìm thấy bản vẽ.")
          return
        }

        const orderedImages = item.images
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
        setDrawing(item)
        setTitle(item.title)
        setSlug(item.slug)
        setExcerpt(item.excerpt)
        setDescription(item.description)
        setCategoryId(item.categoryId)
        setPrice(String(item.price))
        setPriceType(item.priceType)
        setStatus(item.status)
        setFeatured(item.featured)
        setImages(orderedImages)
        setCoverImageId(item.coverImageId || orderedImages[0]?.id || "")
      })
      .catch(() => setError("Không thể tải bản vẽ."))
      .finally(() => setLoading(false))
  }, [params?.id])

  const updateImage = (
    index: number,
    field: "url" | "alt",
    value: string,
  ) => {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image,
      ),
    )
  }

  const addImage = () => {
    const id = `image-${Date.now()}`
    setImages((current) => [
      ...current,
      { id, url: "", alt: "", sortOrder: current.length },
    ])
    if (!coverImageId) setCoverImageId(id)
  }

  useEffect(() => {
    if (coverImageId && images.some((image) => image.id === coverImageId)) return
    setCoverImageId(images[0]?.id || "")
  }, [coverImageId, images])

  const removeImage = (index: number) => {
    setImages((current) => current
      .filter((_, imageIndex) => imageIndex !== index)
      .map((image, imageIndex) => ({ ...image, sortOrder: imageIndex })))
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = current.slice()
      const [moved] = next.splice(index, 1)
      if (!moved) return current
      next.splice(target, 0, moved)
      return next.map((image, imageIndex) => ({
        ...image,
        sortOrder: imageIndex,
      }))
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!drawing?.id || saving) return

    setSaving(true)
    setError("")
    try {
      const orderedImages = images
        .filter((image) => image.url.trim() || image.alt.trim())
        .map((image, index) => ({
          ...image,
          sortOrder: index,
        }))
      if (orderedImages.some((image) => !image.url.trim() || !image.alt.trim())) {
        throw new Error("Mỗi ảnh cần có URL và mô tả alt.")
      }
      if (status === "published" && orderedImages.length === 0) {
        throw new Error("Bản vẽ xuất bản cần ít nhất một ảnh.")
      }
      if (coverImageId && !orderedImages.some((image) => image.id === coverImageId)) {
        throw new Error("Ảnh cover không còn trong gallery.")
      }

      await ShopBanVeRepository.updateDrawing(
        drawing.id,
        {
          title: title.trim(),
          slug: slug || slugifyShopText(title),
          excerpt: excerpt.trim(),
          description: description.trim(),
          categoryId,
          price: Number(price) || 0,
          priceType,
          status,
          featured,
          coverImageId: coverImageId || orderedImages[0]?.id,
          images: orderedImages,
          formats: drawing.formats,
          fileMeta: drawing.fileMeta,
        },
        user?.uid,
      )
      router.push("/admin/drawings")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu thay đổi.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error || "Không tìm thấy bản vẽ."}
        </p>
        <Link
          href="/admin/drawings"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/drawings"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách bản vẽ
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sửa bản vẽ</h1>
        <p className="mt-1 text-gray-600">
          Cập nhật nội dung, trạng thái và gallery.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="grid gap-4 rounded-lg border bg-white p-5">
          <label className="block text-sm font-medium">
            Tên bản vẽ
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Slug
            <input
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Mô tả ngắn
            <textarea
              required
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="mt-1 min-h-20 w-full rounded-md border p-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Mô tả chi tiết
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 min-h-32 w-full rounded-md border p-3"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Danh mục
              <select
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border px-3"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Trạng thái
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as typeof status)
                }
                className="mt-1 h-10 w-full rounded-md border px-3"
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Giá
              <input
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border px-3"
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Kiểu giá
            <select
              value={priceType}
              onChange={(event) =>
                setPriceType(event.target.value as typeof priceType)
              }
              className="mt-1 h-10 w-full rounded-md border px-3"
            >
              <option value="contact">Liên hệ tư vấn</option>
              <option value="paid">Hiện giá</option>
              <option value="free">Miễn phí</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />
            Bản vẽ nổi bật
          </label>
        </section>

        <section className="space-y-4 rounded-lg border bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">Gallery nhiều ảnh</h2>
              <p className="mt-1 text-sm text-gray-500">
                Tải ảnh lên Firebase Storage hoặc nhập URL CDN. Ảnh đầu tiên là
                vị trí mặc định nếu chưa chọn cover.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={uploadImages}
                  disabled={uploading}
                  className="sr-only"
                />
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {uploading ? "Đang tải..." : "Tải ảnh"}
              </label>
              <button
                type="button"
                onClick={addImage}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> Thêm URL
              </button>
            </div>
          </div>

          {images.length === 0 && (
            <p className="rounded-md border border-dashed p-5 text-center text-sm text-gray-500">
              Chưa có ảnh. Bản nháp có thể lưu không cần ảnh; bản vẽ xuất bản
              phải có ít nhất một ảnh.
            </p>
          )}

          {images.map((image, index) => (
            <div key={image.id} className="rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-[112px_1fr_auto]">
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-gray-100 sm:aspect-square">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt || "Xem trước ảnh bản vẽ"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-gray-500">
                      Chưa có ảnh
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  <input
                    required
                    value={image.url}
                    onChange={(event) => updateImage(index, "url", event.target.value)}
                    className="h-10 rounded-md border px-3 text-sm"
                    placeholder="https://..."
                  />
                  <input
                    required
                    value={image.alt}
                    onChange={(event) => updateImage(index, "alt", event.target.value)}
                    className="h-10 rounded-md border px-3 text-sm"
                    placeholder="Mô tả alt"
                  />
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="cover-image"
                      checked={coverImageId === image.id}
                      onChange={() => setCoverImageId(image.id)}
                    />
                    Ảnh cover
                  </label>
                </div>
                <div className="flex items-start justify-end gap-1 sm:flex-col">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    aria-label="Đưa ảnh lên"
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Đưa ảnh xuống"
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label="Xóa ảnh"
                    className="rounded-md p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={saving || uploading}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </button>
      </form>
    </div>
  )
}
