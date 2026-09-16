"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import { slugifyShopText } from "@/lib/shopbanve/validation"
import { useAuth } from "@/lib/firebase-auth"

export default function NewArticlePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("Kiến thức")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (title.trim().length < 3 || content.trim().length < 1) {
      setError("Vui lòng nhập tiêu đề và nội dung bài viết.")
      return
    }
    if (saving) return
    setSaving(true)
    setError("")
    try {
      await ShopBanVeRepository.addArticle(
        {
          title: title.trim(),
          slug: slug || slugifyShopText(title),
          category: category.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          tags: [],
          status,
          viewCount: 0,
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/articles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600">
        <ArrowLeft className="h-4 w-4" /> Danh sách bài viết
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Viết bài mới</h1>
        <p className="mt-1 text-gray-600">Tạo nội dung cho mục kiến thức Shop Bản Vẽ.</p>
      </div>
      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-white p-5">
        <label className="block text-sm font-medium">
          Tiêu đề
          <input required minLength={3} value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugifyShopText(event.target.value)) }} className="mt-1 h-10 w-full rounded-md border px-3" />
        </label>
        <label className="block text-sm font-medium">
          Slug
          <input required value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Chuyên mục
            <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" />
          </label>
          <label className="block text-sm font-medium">
            Trạng thái
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 h-10 w-full rounded-md border px-3">
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">
          Tóm tắt
          <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="mt-1 min-h-20 w-full rounded-md border p-3" />
        </label>
        <label className="block text-sm font-medium">
          Nội dung
          <textarea required value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-64 w-full rounded-md border p-3" placeholder="Có thể nhập HTML cơ bản hoặc nội dung văn bản." />
        </label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu bài viết
        </button>
      </form>
    </div>
  )
}
