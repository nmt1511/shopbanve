"use client"

import Link from "next/link"
import { ArrowUpRight, CalendarDays, Clock3, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopArticle } from "@/lib/shopbanve/types"

export default function NewsSection({ showArticleLink = true }: { showArticleLink?: boolean }) {
  const [articles, setArticles] = useState<ShopArticle[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ShopBanVeRepository.getPublishedArticles(3).then(setArticles).catch(() => undefined).finally(() => setLoading(false))
    return ShopBanVeRepository.onPublishedArticlesChange((items) => setArticles(items.slice(0, 3)))
  }, [])
  return <section id="tin-tuc" className="bg-[#f7f9fc] py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Góc chia sẻ</p><h2 className="mt-3 text-3xl font-black tracking-tight text-[#172554] sm:text-4xl">Kiến thức mới nhất</h2></div>{showArticleLink && <Link href="/bai-viet" className="inline-flex items-center gap-2 text-sm font-bold text-[#172554] hover:text-[#f97316]">Xem tất cả bài viết <ArrowUpRight className="h-4 w-4" /></Link>}</div>{loading ? <div className="mt-7 flex min-h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#f97316]" /></div> : articles.length === 0 ? <div className="mt-10 rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Chưa có bài viết được xuất bản.</div> : <div className="mt-7 grid gap-6 md:grid-cols-3">{articles.map((article) => <article key={article.id || article.slug} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[1.75] overflow-hidden bg-slate-100"><img loading="lazy" decoding="async" src={article.featuredImage || "/placeholder.svg"} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-6"><span className="text-xs font-bold uppercase tracking-wider text-[#f97316]">{article.category || "Kiến thức"}</span><h3 className="mt-3 text-xl font-bold leading-snug text-[#172554]">{article.title}</h3><div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400"><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(article.publishedAt || article.createdAt).toLocaleDateString("vi-VN")}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />5 phút đọc</span></div><Link href={`/bai-viet/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#172554] hover:text-[#f97316]">Đọc bài viết <ArrowUpRight className="h-4 w-4" /></Link></div></article>)}</div>}</div></section>
}
