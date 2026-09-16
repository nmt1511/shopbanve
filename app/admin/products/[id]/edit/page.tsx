"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Upload, X } from "lucide-react"
import { FirebaseDB, type Category, type Product } from "@/lib/firebase-db"
import { CloudinaryUploader } from "@/lib/cloudinary"
import { useAuth } from "@/lib/firebase-auth"
import { useToast } from "@/hooks/use-toast"

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    image_url: "",
    category_id: "",
    price: "",
    unit: "kg",
    stock: "",
    status: "active" as Product["status"],
    description: "",
    sku: "",
    steelGrade: "",
    thickness: "",
  })

  useEffect(() => {
    const id = params?.id
    if (!id) return

    Promise.all([FirebaseDB.getProduct(id), FirebaseDB.getCategories()])
      .then(([item, categoryItems]) => {
        setCategories(categoryItems.filter((category) => category.status === "active" || category.id === item?.category_id))
        if (!item) {
          setError("Không tìm thấy sản phẩm.")
          return
        }
        setProduct(item)
        setForm({
          name: item.name,
          image_url: item.image_url ?? "",
          category_id: item.category_id,
          price: String(item.price),
          unit: item.unit,
          stock: String(item.stock),
          status: item.status,
          description: item.description ?? "",
          sku: item.sku ?? "",
          steelGrade: item.steelGrade ?? "",
          thickness: item.thickness ?? "",
        })
      })
      .catch(() => setError("Không thể tải thông tin sản phẩm."))
      .finally(() => setLoading(false))
  }, [params?.id])

  const change = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Ảnh phải đúng định dạng và không vượt quá 5MB.")
      return
    }

    setUploading(true)
    setError("")
    try {
      const uploaded = await CloudinaryUploader.uploadImage(file, "inox-products")
      change("image_url", uploaded.secure_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.")
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product?.id) return

    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.category_id || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setError("Vui lòng nhập tên, danh mục, giá hợp lệ và tồn kho là số nguyên không âm.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await FirebaseDB.updateProduct(
        product.id,
        {
          name: form.name.trim(),
          image_url: form.image_url.trim(),
          category_id: form.category_id,
          price,
          unit: form.unit.trim() || "kg",
          stock,
          status: form.status,
          description: form.description.trim(),
          sku: form.sku.trim(),
          steelGrade: form.steelGrade.trim(),
          thickness: form.thickness.trim(),
        },
        user?.uid || "admin",
      )
      toast({ title: "Đã lưu", description: "Thông tin sản phẩm đã được cập nhật." })
      router.push(`/admin/products/${product.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu sản phẩm.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!product) return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy sản phẩm."}</p><Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/admin/products/${product.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Chi tiết sản phẩm</Link>
      <div><h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1><p className="mt-1 text-gray-600">Cập nhật thông tin sản phẩm đang kinh doanh.</p></div>
      <form onSubmit={submit} className="space-y-6 rounded-lg border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Tên sản phẩm *<input required value={form.name} onChange={(event) => change("name", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">SKU<input value={form.sku} onChange={(event) => change("sku", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">Danh mục *<select required value={form.category_id} onChange={(event) => change("category_id", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3"><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="block text-sm font-medium">Trạng thái<select value={form.status} onChange={(event) => change("status", event.target.value as Product["status"])} className="mt-1 h-10 w-full rounded-md border px-3"><option value="active">Hoạt động</option><option value="inactive">Không hoạt động</option></select></label>
          <label className="block text-sm font-medium">Giá (VNĐ) *<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(event) => change("price", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">Tồn kho *<input required min="0" step="1" type="number" value={form.stock} onChange={(event) => change("stock", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">Đơn vị<input value={form.unit} onChange={(event) => change("unit", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">Mác thép<input value={form.steelGrade} onChange={(event) => change("steelGrade", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
          <label className="block text-sm font-medium">Độ dày<input value={form.thickness} onChange={(event) => change("thickness", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
        </div>
        <label className="block text-sm font-medium">Mô tả<textarea value={form.description} onChange={(event) => change("description", event.target.value)} className="mt-1 min-h-32 w-full rounded-md border p-3" /></label>
        <div className="space-y-3"><p className="text-sm font-medium">Ảnh sản phẩm</p>{form.image_url && <div className="relative w-fit"><img src={form.image_url} alt={form.name || "Ảnh sản phẩm"} className="h-40 w-40 rounded-md object-cover" /><button type="button" onClick={() => change("image_url", "")} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white" aria-label="Xóa ảnh"><X className="h-4 w-4" /></button></div>}<label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-gray-50"><Upload className="h-4 w-4" /> {uploading ? "Đang tải..." : "Tải ảnh mới"}<input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" /></label></div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5"><Link href={`/admin/products/${product.id}`} className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold">Hủy</Link><button disabled={saving || uploading} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi</button></div>
      </form>
    </div>
  )
}

