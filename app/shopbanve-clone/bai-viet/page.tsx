"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarDays, Clock3, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PageIntro } from "../components/site-page"
import ShopShell from "../components/shop-shell"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopArticle } from "@/lib/shopbanve/types"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ShopArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    ShopBanVeRepository.getPublishedArticles()
      .then((items) => { if (active) setArticles(items) })
      .catch(() => { if (active) { setError("Không thể tải bài viết mới nhất."); setArticles([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <ShopShell><PageIntro eyebrow="Góc chia sẻ" title="Kiến thức cho người làm kỹ thuật" description="Những bài viết ngắn, thực tế và dễ áp dụng trong học tập cũng như công việc hàng ngày." /><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">{error && <p className="mb-5 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">{error}</p>}{loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#f97316]" /></div> : <div className="grid gap-6 md:grid-cols-2">{articles.map((article, index) => <article key={article.id || article.slug} className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white ${index === 0 ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}><div className="aspect-[1.7] overflow-hidden bg-slate-100 md:aspect-auto"><img loading="lazy" decoding="async" src={article.featuredImage || "/placeholder.svg"} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f97316]">{article.category || "Kiến thức"}</p><h2 className="mt-3 text-2xl font-black leading-snug text-[#172554]">{article.title}</h2><div className="mt-7 flex items-center gap-4 text-xs font-medium text-slate-400"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(article.publishedAt || article.createdAt).toLocaleDateString("vi-VN")}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />5 phút đọc</span></div><Link href={`/bai-viet/${article.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#172554] hover:text-[#f97316]">Đọc bài viết <ArrowUpRight className="h-4 w-4" /></Link></div></article>)}</div>}</section></ShopShell>
}
