"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, Download, FileText, Layers3, Loader2 } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing, HomepageOptions, ShopCategory } from "@/lib/shopbanve/types"

const fallbackCategories = [
  { title: "Dự án kiến trúc", count: "Đồ án kiến trúc", image: "/stainless-steel-sheet-.jpg", color: "bg-blue-50 text-blue-700", href: "/danh-muc" },
  { title: "Dự án kết cấu", count: "Đồ án kết cấu", image: "/stainless-steel-pipe-.jpg", color: "bg-orange-50 text-orange-700", href: "/danh-muc" },
  { title: "Dự án xây dựng", count: "Luận văn & tham khảo", image: "/stainless-steel-sheets-and-materials.jpg", color: "bg-emerald-50 text-emerald-700", href: "/do-an" },
]
const fallbackFeatured: Drawing[] = []

function coverImage(drawing: Drawing) {
  return drawing.images.find((image) => image.id === drawing.coverImageId)?.url || drawing.images[0]?.url || "/placeholder.svg"
}
function priceLabel(drawing: Drawing) {
  if (drawing.priceType === "free") return "Miễn phí"
  if (drawing.priceType === "contact") return "Liên hệ"
  return `${drawing.price.toLocaleString("vi-VN")}đ`
}

export default function ProductsSection({ options }: { options?: HomepageOptions }) {
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [featured, setFeatured] = useState<Drawing[]>(fallbackFeatured)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([ShopBanVeRepository.getCategories(), ShopBanVeRepository.getFeaturedDrawings(6)])
      .then(([categoryItems, drawings]) => { setCategories(categoryItems.filter((item) => item.status === "active")); setFeatured(drawings) })
      .catch(() => undefined)
      .finally(() => setLoading(false))
    return ShopBanVeRepository.onPublishedDrawingsChange((drawings) => setFeatured(drawings.filter((item) => item.featured).slice(0, 3)))
  }, [])
  const visibleCategories = (categories.length > 0 ? categories.slice(0, 3) : []).map((category, index) => ({
    key: category.id || `category-${index}`,
    title: category.name,
    count: "Danh mục tài liệu",
    image: category.image || fallbackCategories[index]?.image || fallbackCategories[0]?.image || "/placeholder.svg",
    color: fallbackCategories[index]?.color || "bg-blue-50 text-blue-700",
    href: category.id ? `/danh-muc?category=${category.id}` : "/danh-muc",
  }))
  const categoryCards = visibleCategories.length > 0 ? visibleCategories : fallbackCategories.map((category) => ({ key: category.title, ...category }))

  return <section id="danh-muc" className="bg-white py-20 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Khám phá thư viện</p><h2 className="mt-3 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Tìm đúng tài liệu cho dự án</h2><p className="mt-3 max-w-xl text-slate-500">Dự án, đồ án, luận văn và tài liệu tham khảo được phân loại theo lĩnh vực để bạn bắt đầu nhanh hơn.</p></div>{options?.showCategoryLink !== false && <Link href="/danh-muc" className="inline-flex items-center gap-2 text-sm font-bold text-[#172554] hover:text-[#f97316]">Xem tất cả danh mục <ArrowUpRight className="h-4 w-4" /></Link>}</div><div className="mt-12 grid gap-5 md:grid-cols-3">{categoryCards.map((category) => <Link key={category.key} href={category.href} className="group relative min-h-56 overflow-hidden rounded-2xl bg-slate-900"><img loading="lazy" decoding="async" src={category.image} alt={category.title} className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-105 group-hover:opacity-70" /><div className="absolute inset-0 bg-gradient-to-t from-[#172554] via-[#172554]/35 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6 text-white"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${category.color}`}>{category.count}</span><h3 className="mt-3 text-xl font-bold">{category.title}</h3><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-200">Khám phá <ArrowUpRight className="h-4 w-4" /></span></div></Link>)}</div><div id="do-an" className="mt-20 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Được quan tâm nhất</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#172554] sm:text-3xl">Tài liệu nổi bật tuần này</h2></div>{options?.showDailyUpdate !== false && <span className="hidden items-center gap-2 text-sm font-medium text-slate-400 sm:flex"><Layers3 className="h-4 w-4" /> Cập nhật mỗi ngày</span>}</div>{loading ? <div className="mt-8 flex min-h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#f97316]" /></div> : featured.length === 0 ? <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Chưa có bản vẽ nổi bật. Xem toàn bộ thư viện để chọn tài liệu phù hợp.</div> : <div className="mt-8 grid gap-6 md:grid-cols-3">{featured.map((item, index) => <article key={item.id || item.slug} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/60"><div className="relative aspect-[1.55] overflow-hidden bg-slate-100"><img loading="lazy" decoding="async" src={coverImage(item)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{index === 0 && <span className="absolute left-4 top-4 rounded-full bg-[#f97316] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Nổi bật</span>}<span className="absolute bottom-4 right-4 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600 backdrop-blur">{item.formats[0] || "CAD"}</span></div><div className="p-5"><div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><FileText className="h-3.5 w-3.5" /> {item.tags[0] || "Tài liệu kỹ thuật"}</div><h3 className="mt-3 min-h-12 text-lg font-bold leading-snug text-[#172554]">{item.title}</h3><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-lg font-black text-[#f97316]">{priceLabel(item)}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Download className="h-3 w-3" /> {item.viewCount.toLocaleString("vi-VN")} lượt xem</p></div><Link href={`/ban-ve/${item.slug}`} className="rounded-lg bg-blue-50 p-2.5 text-[#172554] transition hover:bg-[#172554] hover:text-white" aria-label={`Xem ${item.title}`}><ArrowUpRight className="h-5 w-5" /></Link></div></div></article>)}</div>}</div></section>
}
