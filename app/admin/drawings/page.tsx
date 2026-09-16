"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Archive, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing, ShopCategory } from "@/lib/shopbanve/types"
import { useAuth } from "@/lib/firebase-auth"

function priceLabel(_drawing: Drawing) {
  return "Liên hệ báo giá"
}

export default function AdminDrawingsPage() {
  const { user } = useAuth()
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([ShopBanVeRepository.getDrawings(), ShopBanVeRepository.getCategories()])
      .then(([items, categoryItems]) => {
        if (!active) return
        setDrawings(items)
        setCategories(categoryItems)
      })
      .catch(() => active && setMessage("Không thể tải dữ liệu bản vẽ."))
      .finally(() => active && setLoading(false))
    const unsubscribe = ShopBanVeRepository.onDrawingsChange((items) => {
      if (active) setDrawings(items)
    })
    return () => { active = false; unsubscribe() }
  }, [])

  const filtered = useMemo(() => drawings.filter((drawing) => {
    const matchesQuery = `${drawing.title} ${drawing.slug}`.toLocaleLowerCase("vi-VN").includes(query.trim().toLocaleLowerCase("vi-VN"))
    return matchesQuery && (status === "all" || drawing.status === status)
  }), [drawings, query, status])

  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name || "Chưa phân loại"

  const archive = async (drawing: Drawing) => {
    if (!drawing.id || !confirm(`Lưu trữ bản vẽ “${drawing.title}”?`)) return
    try {
      await ShopBanVeRepository.archiveDrawing(drawing.id, user?.uid)
      setDrawings((current) => current.map((item) => item.id === drawing.id ? { ...item, status: "archived" } : item))
    } catch { setMessage("Không thể lưu trữ bản vẽ.") }
  }

  const remove = async (drawing: Drawing) => {
    if (!drawing.id || !confirm(`Xóa vĩnh viễn bản vẽ “${drawing.title}”?`)) return
    try {
      await ShopBanVeRepository.deleteDrawing(drawing.id, user?.uid)
      setDrawings((current) => current.filter((item) => item.id !== drawing.id))
    } catch { setMessage("Không thể xóa bản vẽ.") }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-3xl font-bold text-gray-900">Bản vẽ Shop Bản Vẽ</h1><p className="mt-1 text-gray-600">Quản lý catalog, gallery và trạng thái xuất bản.</p></div><Link href="/admin/drawings/new" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Thêm bản vẽ</Link></div>
    {message && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc slug..." className="h-10 w-full rounded-md border pl-9 pr-3 text-sm" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border px-3 text-sm"><option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="archived">Đã lưu trữ</option></select></div>
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Tên bản vẽ</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{filtered.map((drawing) => <tr key={drawing.id}><td className="px-4 py-4"><p className="font-semibold text-gray-900">{drawing.title}</p><p className="mt-1 text-xs text-gray-500">/{drawing.slug} · {drawing.images.length} ảnh</p></td><td className="px-4 py-4">{categoryName(drawing.categoryId)}</td><td className="px-4 py-4 font-semibold">{priceLabel(drawing)}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${drawing.status === "published" ? "bg-emerald-100 text-emerald-700" : drawing.status === "archived" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}>{drawing.status === "published" ? "Đã xuất bản" : drawing.status === "archived" ? "Đã lưu trữ" : "Bản nháp"}</span></td><td className="px-4 py-4"><div className="flex justify-end gap-1"><Link href={`/admin/drawings/${drawing.id}/edit`} aria-label={`Sửa ${drawing.title}`} className="rounded-md p-2 text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></Link>{drawing.status !== "archived" && <button type="button" onClick={() => archive(drawing)} aria-label={`Lưu trữ ${drawing.title}`} className="rounded-md p-2 text-amber-600 hover:bg-amber-50"><Archive className="h-4 w-4" /></button>}<button type="button" onClick={() => remove(drawing)} aria-label={`Xóa ${drawing.title}`} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-10 text-center text-sm text-gray-500">Chưa có bản vẽ phù hợp.</p>}</div>
  </div>
}
