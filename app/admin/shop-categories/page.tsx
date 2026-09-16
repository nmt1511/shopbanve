"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Edit, FolderOpen, Loader2, Plus, Save, Trash2, X } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopCategory } from "@/lib/shopbanve/types"
import { slugifyShopText } from "@/lib/shopbanve/validation"
import { useAuth } from "@/lib/firebase-auth"

const emptyForm = { name: "", slug: "", description: "", image: "", order: "0", status: "active" as ShopCategory["status"] }

type CategoryForm = typeof emptyForm

export default function ShopCategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    const load = () => ShopBanVeRepository.getCategories()
      .then((items) => { if (active) setCategories(items) })
      .catch(() => { if (active) setError("Không thể tải danh mục.") })
      .finally(() => { if (active) setLoading(false) })
    load()
    const unsubscribe = ShopBanVeRepository.onCategoriesChange((items) => {
      if (active) setCategories(items)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const filtered = useMemo(() => categories.filter((category) => `${category.name} ${category.slug}`.toLocaleLowerCase("vi-VN").includes(query.trim().toLocaleLowerCase("vi-VN"))), [categories, query])
  const setField = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => setForm((current) => ({ ...current, [field]: value }))
  const reset = (clearMessage = true) => { setEditingId(null); setForm({ ...emptyForm }); setError(""); if (clearMessage) setMessage("") }
  const edit = (category: ShopCategory) => { setEditingId(category.id ?? null); setForm({ name: category.name, slug: category.slug, description: category.description ?? "", image: category.image ?? "", order: String(category.order), status: category.status }); setMessage(""); setError("") }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("")
    try {
      const payload = { name: form.name.trim(), slug: form.slug || slugifyShopText(form.name), description: form.description.trim() || undefined, image: form.image.trim() || undefined, order: Math.max(0, Number(form.order) || 0), status: form.status }
      if (editingId) await ShopBanVeRepository.updateCategory(editingId, payload, user?.uid)
      else await ShopBanVeRepository.addCategory({ ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, user?.uid)
      const successMessage = editingId ? "Đã cập nhật danh mục." : "Đã tạo danh mục."
      reset(false)
      setCategories(await ShopBanVeRepository.getCategories())
      setMessage(successMessage)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu danh mục.") } finally { setSaving(false) }
  }

  const remove = async (category: ShopCategory) => {
    if (!category.id || !confirm(`Xóa danh mục “${category.name}”? Chỉ thực hiện nếu danh mục không còn bản vẽ.`)) return
    try {
      await ShopBanVeRepository.deleteCategory(category.id, user?.uid)
      setCategories((current) => current.filter((item) => item.id !== category.id))
      setMessage("Đã xóa danh mục.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa danh mục.")
    }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Danh mục bản vẽ</h1><p className="mt-1 text-gray-600">Tạo và sắp xếp nhóm tài liệu Shop Bản Vẽ.</p></div>{(error || message) && <p role={error ? "alert" : "status"} className={`rounded-md p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"><section className="overflow-x-auto rounded-lg border bg-white"><div className="flex items-center gap-3 border-b p-4"><div className="relative flex-1"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm danh mục..." className="h-10 w-full rounded-md border px-3 text-sm" /></div><span className="text-sm text-gray-500">{filtered.length} danh mục</span></div><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Thứ tự</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{filtered.map((category) => <tr key={category.id}><td className="px-4 py-4"><div className="flex items-center gap-2 font-semibold"><FolderOpen className="h-4 w-4 text-blue-600" />{category.name}</div></td><td className="px-4 py-4 text-gray-500">{category.slug}</td><td className="px-4 py-4">{category.order}</td><td className="px-4 py-4">{category.status === "active" ? "Đang dùng" : "Tạm dừng"}</td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => edit(category)} aria-label={`Sửa ${category.name}`} className="rounded-md p-2 text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => remove(category)} aria-label={`Xóa ${category.name}`} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-10 text-center text-sm text-gray-500">Chưa có danh mục.</p>}</section><form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">{editingId ? "Sửa danh mục" : "Thêm danh mục"}</h2>{editingId && <button type="button" onClick={() => reset()} aria-label="Hủy sửa" className="rounded-md p-2 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>}</div><label className="block text-sm font-medium">Tên danh mục<input required minLength={2} value={form.name} onChange={(event) => { setField("name", event.target.value); if (!editingId && !form.slug) setField("slug", slugifyShopText(event.target.value)) }} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Slug<input required value={form.slug} onChange={(event) => setField("slug", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Mô tả<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="mt-1 min-h-20 w-full rounded-md border p-3" /></label><label className="block text-sm font-medium">Ảnh đại diện<input type="url" value={form.image} onChange={(event) => setField("image", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" placeholder="https://..." /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Thứ tự<input type="number" min="0" value={form.order} onChange={(event) => setField("order", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Trạng thái<select value={form.status} onChange={(event) => setField("status", event.target.value as CategoryForm["status"])} className="mt-1 h-10 w-full rounded-md border px-3"><option value="active">Đang dùng</option><option value="paused">Tạm dừng</option></select></label></div><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingId ? "Lưu thay đổi" : "Tạo danh mục"}</button></form></div></div>
}
