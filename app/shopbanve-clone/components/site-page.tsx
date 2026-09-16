"use client"

import type { FormEvent, ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, FileQuestion, Loader2, Search, ShieldCheck } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing } from "@/lib/shopbanve/types"

function coverImage(drawing: Drawing) {
  const cover = drawing.images.find((image) => image.id === drawing.coverImageId) ?? drawing.images.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0]
  return cover?.url || "/placeholder.svg"
}

function priceLabel(_drawing: Drawing) {
  return "Liên hệ báo giá"
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="border-b border-slate-200 bg-white py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#f97316]"><ArrowLeft className="h-4 w-4" /> Về trang chủ</Link><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">{eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#172554] sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">{description}</p></div></section>
}

export function PlaceholderPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <><PageIntro eyebrow={eyebrow} title={title} description={description} /><section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">{children}</section></>
}

export function CatalogGrid({ query = "", categoryId = "" }: { query?: string; categoryId?: string }) {
  const [items, setItems] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")

  useEffect(() => {
    let active = true
    setLoading(true)
    setItems([])
    setError("")
    const load = query.trim()
      ? ShopBanVeRepository.searchDrawings(query)
      : categoryId
        ? ShopBanVeRepository.getDrawingsByCategory(categoryId)
        : ShopBanVeRepository.getPublishedDrawings()
    load
      .then((drawings) => { if (active) setItems(drawings) })
      .catch(() => { if (active) { setError("Không thể tải thư viện lúc này."); setItems([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [categoryId, query])

  useEffect(() => {
    const unsubscribe = ShopBanVeRepository.onPublishedDrawingsChange((drawings) => {
      if (categoryId || query.trim()) return
      setItems(drawings)
      setError("")
    })
    return unsubscribe
  }, [categoryId, query])

  const filteredItems = items.filter((drawing) => {
    const matchesCategory = !categoryId || drawing.categoryId === categoryId
    const haystack = `${drawing.title} ${drawing.excerpt} ${drawing.description} ${drawing.tags.join(" ")}`.toLocaleLowerCase("vi-VN")
    return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery))
  })

  if (loading) return <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#f97316]" /><span className="sr-only">Đang tải thư viện</span></div>
  if (filteredItems.length === 0) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><FileQuestion className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-4 text-lg font-bold text-[#172554]">Chưa tìm thấy tài liệu phù hợp</h2><p className="mt-2 text-sm text-slate-500">Thử một từ khóa rộng hơn hoặc gửi yêu cầu để chúng tôi tìm giúp bạn.</p><Link href="/lien-he" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172554] px-5 py-3 text-sm font-bold text-white hover:bg-blue-900">Gửi yêu cầu <ArrowRight className="h-4 w-4" /></Link></div>

  return <div>{error && <p className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">Đang hiển thị bản xem trước: {error}</p>}<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredItems.map((drawing) => <article key={drawing.id || drawing.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"><div className="aspect-[1.55] overflow-hidden bg-slate-100"><img loading="lazy" decoding="async" src={coverImage(drawing)} alt={drawing.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" /></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">{drawing.tags[0] || "Tài liệu kỹ thuật"}</p><h2 className="mt-3 min-h-14 text-lg font-bold leading-snug text-[#172554]">{drawing.title}</h2><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="font-black text-[#f97316]">{priceLabel(drawing)}</span><Link href={`/ban-ve/${drawing.slug}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#172554] hover:text-[#f97316]">Xem chi tiết <ArrowRight className="h-4 w-4" /></Link></div></div></article>)}</div></div>
}

export function SearchPanel() {
  const [query, setQuery] = useState("")
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const trimmedQuery = query.trim(); window.location.href = trimmedQuery ? `/tim-kiem?q=${encodeURIComponent(trimmedQuery)}` : "/tim-kiem" }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><span className="sr-only">Từ khóa tìm kiếm</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" placeholder="Tìm tên dự án, đồ án hoặc tài liệu..." /></label><button type="submit" className="h-12 rounded-xl bg-[#172554] px-7 text-sm font-bold text-white transition hover:bg-blue-900 active:scale-[.98]">Tìm kiếm</button></form></div>
}

export function FeatureList() {
  return <div className="grid gap-4 sm:grid-cols-3">{[[ShieldCheck, "File được kiểm tra", "Mỗi tài liệu có mô tả rõ ràng về định dạng và phiên bản."], [Check, "Tải đúng thứ cần", "Xem trước thông tin trước khi thêm vào thư viện cá nhân."], [FileQuestion, "Luôn có người hỗ trợ", "Gửi câu hỏi khi bạn cần tìm một tài liệu cụ thể."]].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <div key={title as string} className="border-l-2 border-orange-200 pl-4"><FeatureIcon className="h-5 w-5 text-[#f97316]" /><h3 className="mt-3 font-bold text-[#172554]">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description as string}</p></div> })}</div>
}
