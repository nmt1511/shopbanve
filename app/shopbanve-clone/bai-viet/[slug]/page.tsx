"use client"

import Link from "next/link"
import { ArrowLeft, CalendarDays, Clock3, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ShopShell from "../../components/shop-shell"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopArticle } from "@/lib/shopbanve/types"
import { sanitizeShopArticleHtml } from "@/lib/shopbanve/sanitize"

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ShopArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slug = params?.slug
    if (!slug) return
    let active = true
    ShopBanVeRepository.getArticleBySlug(slug)
      .then(async (item) => {
        if (!active) return
        setArticle(item)
        if (item?.id) await ShopBanVeRepository.incrementArticleViewCount(item.id).catch(() => undefined)
      })
      .catch(() => {
        if (!active) return
        setArticle(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params?.slug])
  if (loading) return <ShopShell><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#f97316]" /></div></ShopShell>
  if (!article) return <ShopShell><section className="mx-auto max-w-2xl px-4 py-24 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Không tìm thấy</p><h1 className="mt-3 text-3xl font-black text-[#172554]">Bài viết không còn khả dụng</h1><Link href="/bai-viet" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#172554] px-5 py-3 text-sm font-bold text-white"> <ArrowLeft className="h-4 w-4" /> Tất cả bài viết</Link></section></ShopShell>

  return <ShopShell><article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-20"><Link href="/bai-viet" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#f97316]"><ArrowLeft className="h-4 w-4" /> Tất cả bài viết</Link><p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">{article.category || "Kiến thức"}</p><h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#172554] sm:text-5xl">{article.title}</h1><div className="mt-6 flex items-center gap-5 text-sm text-slate-400"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Date(article.publishedAt || article.createdAt).toLocaleDateString("vi-VN")}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />5 phút đọc</span></div>{article.featuredImage && <img src={article.featuredImage} alt={article.title} className="mt-10 aspect-[1.8] w-full rounded-2xl object-cover" />}<div className="prose prose-slate mt-10 max-w-none text-base leading-8" dangerouslySetInnerHTML={{ __html: sanitizeShopArticleHtml(article.content) }} /></article></ShopShell>
}
