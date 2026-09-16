"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Tag, Upload, X } from "lucide-react"
import { FirebaseDB, type NewsArticle, type Tag as NewsTag } from "@/lib/firebase-db"
import { CloudinaryUploader } from "@/lib/cloudinary"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useAuth } from "@/lib/firebase-auth"
import { useToast } from "@/hooks/use-toast"

export default function EditNewsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [tags, setTags] = useState<NewsTag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
    status: "draft" as NewsArticle["status"],
    published_at: "",
    tag_ids: [] as string[],
  })

  useEffect(() => {
    const id = params?.id
    if (!id) return

    Promise.all([FirebaseDB.getNewsArticle(id), FirebaseDB.getTags()])
      .then(([item, tagItems]) => {
        setTags(tagItems)
        if (!item) {
          setError("Không tìm thấy bài viết.")
          return
        }
        setArticle(item)
        setForm({
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt ?? "",
          content: item.content,
          featured_image_url: item.featured_image_url ?? "",
          status: item.status,
          published_at: item.published_at ?? "",
          tag_ids: item.tag_ids ?? item.tags?.flatMap((tag) => tag.id ? [tag.id] : []) ?? [],
        })
      })
      .catch(() => setError("Không thể tải bài viết."))
      .finally(() => setLoading(false))
  }, [params?.id])

  const change = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Ảnh phải đúng định dạng và không vượt quá 5MB.")
      return
    }

    setUploading(true)
    setError("")
    try {
      const uploaded = await CloudinaryUploader.uploadImage(file, "news-featured")
      change("featured_image_url", uploaded.secure_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải ảnh lên.")
    } finally {
      setUploading(false)
    }
  }

  const toggleTag = (tagId: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      tag_ids: checked ? [...new Set([...current.tag_ids, tagId])] : current.tag_ids.filter((id) => id !== tagId),
    }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!article?.id) return
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError("Vui lòng nhập tiêu đề, slug và nội dung bài viết.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await FirebaseDB.updateNewsArticle(
        article.id,
        {
          title: form.title.trim(),
          slug: form.slug.trim(),
          excerpt: form.excerpt.trim(),
          content: form.content.trim(),
          featured_image_url: form.featured_image_url.trim(),
          status: form.status,
          published_at: form.status === "published" ? form.published_at || new Date().toISOString() : form.published_at || undefined,
          tag_ids: form.tag_ids,
        },
        user?.uid || "admin",
      )
      toast({ title: "Đã lưu", description: "Bài viết đã được cập nhật." })
      router.push(`/admin/news/${article.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu bài viết.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!article) return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy bài viết."}</p><Link href="/admin/news" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/admin/news/${article.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Chi tiết bài viết</Link>
      <div><h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài viết</h1><p className="mt-1 text-gray-600">Cập nhật nội dung tin tức đang quản lý.</p></div>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <section className="space-y-4 rounded-lg border bg-white p-5"><label className="block text-sm font-medium">Tiêu đề *<input required value={form.title} onChange={(event) => change("title", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Slug *<input required value={form.slug} onChange={(event) => change("slug", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label><label className="block text-sm font-medium">Tóm tắt<textarea value={form.excerpt} onChange={(event) => change("excerpt", event.target.value)} className="mt-1 min-h-24 w-full rounded-md border p-3" /></label><div><label className="text-sm font-medium">Nội dung *</label><RichTextEditor value={form.content} onChange={(value) => change("content", value)} className="mt-1" /></div></section>
            <section className="space-y-4 rounded-lg border bg-white p-5"><p className="text-sm font-medium">Ảnh đại diện</p>{form.featured_image_url && <div className="relative"><img src={form.featured_image_url} alt={form.title || "Ảnh đại diện"} className="h-56 w-full rounded-md object-cover" /><button type="button" onClick={() => change("featured_image_url", "")} aria-label="Xóa ảnh" className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white"><X className="h-4 w-4" /></button></div>}<label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-gray-50"><Upload className="h-4 w-4" /> {uploading ? "Đang tải..." : "Tải ảnh mới"}<input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" /></label></section>
          </div>
          <aside className="space-y-6"><section className="space-y-4 rounded-lg border bg-white p-5"><label className="block text-sm font-medium">Trạng thái<select value={form.status} onChange={(event) => change("status", event.target.value as NewsArticle["status"])} className="mt-1 h-10 w-full rounded-md border px-3"><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="scheduled">Đã lên lịch</option></select></label><label className="block text-sm font-medium">Ngày xuất bản<input type="datetime-local" value={form.published_at ? form.published_at.slice(0, 16) : ""} onChange={(event) => change("published_at", event.target.value)} className="mt-1 h-10 w-full rounded-md border px-3" /></label></section><section className="space-y-3 rounded-lg border bg-white p-5"><p className="flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4" /> Thẻ bài viết</p>{tags.length === 0 ? <p className="text-sm text-gray-500">Chưa có thẻ nào.</p> : tags.map((tag) => <label key={tag.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(tag.id && form.tag_ids.includes(tag.id))} onChange={(event) => tag.id && toggleTag(tag.id, event.target.checked)} />{tag.name}</label>)}</section></aside>
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5"><Link href={`/admin/news/${article.id}`} className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold">Hủy</Link><button disabled={saving || uploading} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi</button></div>
      </form>
    </div>
  )
}

