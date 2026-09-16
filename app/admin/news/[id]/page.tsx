"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FirebaseDB, type NewsArticle } from "@/lib/firebase-db"

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const id = params?.id
    if (!id) return
    FirebaseDB.getNewsArticle(id)
      .then((item) => { if (!item) setError("Không tìm thấy bài viết."); setArticle(item) })
      .catch(() => setError("Không thể tải bài viết."))
      .finally(() => setLoading(false))
  }, [params?.id])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!article) return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy bài viết."}</p><Link href="/admin/news" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></div>

  return <article className="mx-auto max-w-4xl space-y-6"><Link href="/admin/news" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Danh sách tin tức</Link><header><p className="text-sm text-gray-500">Thông tin tin tức đang quản lý</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{article.title}</h1><p className="mt-2 text-sm text-gray-500">{article.status} · {new Date(article.created_at).toLocaleString("vi-VN")}</p></header><section className="rounded-lg border bg-white p-5"><p className="text-sm leading-7 text-gray-700">{article.excerpt}</p><div className="mt-6 whitespace-pre-wrap text-sm leading-8 text-gray-700">{article.content}</div></section></article>
}

