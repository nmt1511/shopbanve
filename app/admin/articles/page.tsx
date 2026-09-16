"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopArticle } from "@/lib/shopbanve/types"
import { useAuth } from "@/lib/firebase-auth"

export default function AdminArticlesPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<ShopArticle[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    ShopBanVeRepository.getArticles()
      .then((items) => {
        if (active) setArticles(items)
      })
      .catch(() => {
        if (active) setError("Không thể tải bài viết.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = ShopBanVeRepository.onArticlesChange((items) => {
      if (active) setArticles(items)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")
    return articles.filter((article) =>
      `${article.title} ${article.slug}`
        .toLocaleLowerCase("vi-VN")
        .includes(normalizedQuery),
    )
  }, [articles, query])

  const removeArticle = async (article: ShopArticle) => {
    if (!article.id || !confirm(`Xóa bài viết “${article.title}”?`)) return

    try {
      await ShopBanVeRepository.deleteArticle(article.id, user?.uid)
      setArticles((current) => current.filter((item) => item.id !== article.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xóa bài viết.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bài viết Shop</h1>
          <p className="mt-1 text-gray-600">Quản lý nội dung kiến thức và hướng dẫn.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Viết bài
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="relative block">
        <span className="sr-only">Tìm bài viết</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm bài viết..."
          className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm"
        />
      </label>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Lượt xem</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((article) => (
              <tr key={article.id}>
                <td className="px-4 py-4 font-semibold">{article.title}</td>
                <td className="px-4 py-4 text-gray-500">{article.slug}</td>
                <td className="px-4 py-4">
                  {article.status === "published"
                    ? "Đã xuất bản"
                    : article.status === "archived"
                      ? "Đã lưu trữ"
                      : "Bản nháp"}
                </td>
                <td className="px-4 py-4">{article.viewCount.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      aria-label={`Sửa ${article.title}`}
                      className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeArticle(article)}
                      aria-label={`Xóa ${article.title}`}
                      className="rounded-md p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-500">Chưa có bài viết.</p>
        )}
      </div>
    </div>
  )
}
