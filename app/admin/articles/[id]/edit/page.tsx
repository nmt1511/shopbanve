"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopArticle } from "@/lib/shopbanve/types"
import { slugifyShopText } from "@/lib/shopbanve/validation"
import { useAuth } from "@/lib/firebase-auth"

export default function EditArticlePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [article, setArticle] = useState<ShopArticle | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const id = params?.id
    if (!id) return

    ShopBanVeRepository.getArticle(id)
      .then((item) => {
        if (!item) {
          setError("Không tìm thấy bài viết.")
          return
        }
        setArticle(item)
        setTitle(item.title)
        setSlug(item.slug)
        setCategory(item.category ?? "")
        setExcerpt(item.excerpt ?? "")
        setContent(item.content)
        setStatus(item.status)
      })
      .catch(() => setError("Không thể tải bài viết."))
      .finally(() => setLoading(false))
  }, [params?.id])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!article?.id || saving) return
    setSaving(true)
    setError("")
    try {
      await ShopBanVeRepository.updateArticle(
        article.id,
        {
          title: title.trim(),
          slug: slug || slugifyShopText(title),
          category: category.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          status,
        },
        user?.uid,
      )
      router.push("/admin/articles")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu bài viết.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  }

  if (!article) {
    return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy bài viết."}</p><Link href="/admin/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Danh sách bài viết</Link>
      <div><h1 className="text-3xl font-bold text-gray-900">Sửa bài viết</h1><p className="mt-1 text-gray-600">Cập nhật nội dung kiến thức Shop Bản Vẽ.</p></div>
      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-white p-5">
        <label className="block text-sm font-medium">Tiêu đề<input required minLength={3} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
        <label className="block text-sm font-medium">Slug<input required value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Chuyên mục<input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 h-10 w-full rounded-md border px-3"><option value="draft">Bản nháp</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label></div>
        <label className="block text-sm font-medium">Tóm tắt<textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border p-3" /></label>
        <label className="block text-sm font-medium">Nội dung<textarea required value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-64 w-full rounded-md border p-3" /></label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi</button>
      </form>
    </div>
  )
}
