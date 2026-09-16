"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import { uploadDrawingImage } from "@/lib/shopbanve/media"
import type { DrawingImage, ShopCategory } from "@/lib/shopbanve/types"
import { slugifyShopText } from "@/lib/shopbanve/validation"
import { useAuth } from "@/lib/firebase-auth"

const emptyImage: DrawingImage = { id: "image-1", url: "", alt: "", sortOrder: 0 }

export default function NewDrawingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [price, setPrice] = useState("0")
  const [priceType, setPriceType] = useState<"paid" | "free" | "contact">("contact")
  const [formats, setFormats] = useState("DWG, PDF")
  const [images, setImages] = useState<DrawingImage[]>([emptyImage])
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    ShopBanVeRepository.getCategories()
      .then((items) => { if (active) setCategories(items) })
      .catch(() => { if (active) setError("Không thể tải danh mục bản vẽ.") })
    return () => { active = false }
  }, [])

  const updateImage = (index: number, field: "url" | "alt", value: string) => setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, [field]: value } : image))
  const addImage = () => setImages((current) => [...current, { ...emptyImage, id: `image-${current.length + 1}`, sortOrder: current.length }])
  const removeImage = (index: number) => setImages((current) => current.length > 1 ? current.filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, sortOrder: imageIndex })) : current)
  const uploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    setUploading(true); setError("")
    try {
      const uploaded = await Promise.all(files.map((file) => uploadDrawingImage(file, user?.uid)))
      setImages((current) => [...current.filter((image) => image.url), ...uploaded.map((image, index) => ({ ...image, sortOrder: current.length + index }))])
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.") } finally { setUploading(false); event.target.value = "" }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setError("")
    if (!categoryId) { setError("Vui lòng chọn danh mục."); return }
    setSaving(true)
    try {
      const imageList = images
        .filter((image) => image.url.trim() || image.alt.trim())
        .map((image, index) => ({ ...image, sortOrder: index }))
      if (imageList.some((image) => !image.url || !image.alt.trim())) {
        setError("Mỗi ảnh cần có URL và mô tả alt.")
        return
      }
      if (status === "published" && imageList.length === 0) {
        setError("Bản vẽ xuất bản cần ít nhất một ảnh.")
        return
      }
      await ShopBanVeRepository.addDrawing({ title: title.trim(), slug: slug || slugifyShopText(title), excerpt: excerpt.trim(), description: description.trim(), categoryId, tags: [], status, price: Number(price) || 0, priceType, coverImageId: imageList[0]?.id, images: imageList, fileMeta: formats.split(",").map((format) => format.trim()).filter(Boolean).map((format, index) => ({ id: `format-${index}`, name: format, format })), formats: formats.split(",").map((format) => format.trim()).filter(Boolean), viewCount: 0, featured, software: [], sizeLabel: "", }, user?.uid)
      router.push("/admin/drawings")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu bản vẽ.") } finally { setSaving(false) }
  }

  return <div className="mx-auto max-w-4xl space-y-6"><Link href="/admin/drawings" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Danh sách bản vẽ</Link><div><h1 className="text-3xl font-bold text-gray-900">Thêm bản vẽ</h1><p className="mt-1 text-gray-600">Tạo tài liệu mới cho catalog Shop Bản Vẽ.</p></div><form onSubmit={submit} className="space-y-6"><section className="space-y-4 rounded-lg border bg-white p-5"><h2 className="font-bold text-gray-900">Thông tin cơ bản</h2><label className="block text-sm font-medium">Tên bản vẽ<input required value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugifyShopText(event.target.value)) }} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Slug<input required value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Mô tả ngắn<textarea required value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border p-3" /></label><label className="block text-sm font-medium">Mô tả chi tiết<textarea required value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-32 w-full rounded-md border p-3" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Danh mục<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3"><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block text-sm font-medium">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 h-10 w-full rounded-md border px-3"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm font-medium">Kiểu giá<select value={priceType} onChange={(event) => setPriceType(event.target.value as typeof priceType)} className="mt-1 h-10 w-full rounded-md border px-3"><option value="contact">Liên hệ</option><option value="paid">Có phí</option><option value="free">Miễn phí</option></select></label><label className="block text-sm font-medium">Giá<input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Định dạng<input value={formats} onChange={(event) => setFormats(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" placeholder="DWG, PDF" /></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Đưa vào bản vẽ nổi bật</label></section><section className="space-y-4 rounded-lg border bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Gallery nhiều ảnh</h2><p className="mt-1 text-sm text-gray-500">Tải ảnh trực tiếp lên Firebase Storage hoặc nhập URL CDN.</p></div><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"><input type="file" accept="image/*" multiple onChange={uploadImages} disabled={uploading} className="sr-only" />{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {uploading ? "Đang tải..." : "Tải ảnh"}</label><button type="button" onClick={addImage} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"><Plus className="h-4 w-4" /> Thêm URL</button></div></div>{images.map((image, index) => <div key={image.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]"><input required value={image.url} onChange={(event) => updateImage(index, "url", event.target.value)} placeholder="https://..." className="h-10 rounded-md border px-3 text-sm" /><input required value={image.alt} onChange={(event) => updateImage(index, "alt", event.target.value)} placeholder="Mô tả ảnh" className="h-10 rounded-md border px-3 text-sm" /><button type="button" onClick={() => removeImage(index)} aria-label="Xóa ảnh" className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}</section>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu bản vẽ</button></form></div>
}
