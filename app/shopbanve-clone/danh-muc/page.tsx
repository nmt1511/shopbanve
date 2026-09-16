"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { CatalogGrid, PageIntro, SearchPanel } from "../components/site-page"
import ShopShell from "../components/shop-shell"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopCategory } from "@/lib/shopbanve/types"

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [categoryId, setCategoryId] = useState(searchParams.get("category") ?? "")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryError, setCategoryError] = useState("")

  useEffect(() => {
    ShopBanVeRepository.getCategories()
      .then((items) => setCategories(items.filter((item) => item.status === "active")))
      .catch(() => setCategoryError("Không thể tải danh mục bộ lọc lúc này."))
  }, [])

  useEffect(() => {
    const nextCategory = searchParams.get("category") ?? ""
    setCategoryId(nextCategory)
  }, [searchParams])

  const selectCategory = (nextCategory: string) => {
    setCategoryId(nextCategory)
    const url = new URL(window.location.href)
    if (nextCategory) url.searchParams.set("category", nextCategory)
    else url.searchParams.delete("category")
    window.history.replaceState(null, "", `${url.pathname}${url.search}`)
  }

  const selectedCategory = useMemo(() => categories.find((category) => category.id === categoryId), [categories, categoryId])

  return <ShopShell><PageIntro eyebrow="Thư viện dự án & tài liệu" title="Danh mục tài liệu kỹ thuật" description="Chọn lĩnh vực, loại tài liệu hoặc tìm kiếm theo tên dự án để bắt đầu." /><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SearchPanel /><div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-slate-500">{selectedCategory ? `Đang lọc: ${selectedCategory.name}` : "Tài liệu được chọn theo nhu cầu"}</p><button type="button" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-200 hover:text-[#f97316]"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc</button></div>{showFilters && <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4"><button type="button" onClick={() => selectCategory("")} className={`rounded-full px-4 py-2 text-sm font-semibold ${!categoryId ? "bg-[#172554] text-white" : "border text-slate-600"}`}>Tất cả</button>{categories.map((category) => <button type="button" key={category.id} onClick={() => selectCategory(category.id ?? "")} className={`rounded-full px-4 py-2 text-sm font-semibold ${categoryId === category.id ? "bg-[#172554] text-white" : "border text-slate-600"}`}>{category.name}</button>)}</div>}{categoryError && <p role="alert" className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">{categoryError}</p>}<div className="mt-6"><CatalogGrid categoryId={categoryId} /></div></section></ShopShell>
}
