"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FirebaseDB, type Product } from "@/lib/firebase-db"

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const id = params?.id
    if (!id) return
    FirebaseDB.getProduct(id)
      .then((item) => { if (!item) setError("Không tìm thấy sản phẩm."); setProduct(item) })
      .catch(() => setError("Không thể tải sản phẩm."))
      .finally(() => setLoading(false))
  }, [params?.id])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!product) return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy sản phẩm."}</p><Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại</Link></div>

  return <article className="mx-auto max-w-4xl space-y-6"><Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Danh sách sản phẩm</Link><header><p className="text-sm text-gray-500">Thông tin sản phẩm đang quản lý</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1><p className="mt-2 text-sm text-gray-500">SKU: {product.sku || "Chưa có"} · {product.status}</p></header><section className="grid gap-4 rounded-lg border bg-white p-5 text-sm sm:grid-cols-2"><div><p className="text-gray-500">Giá</p><p className="mt-1 font-semibold">{product.price.toLocaleString("vi-VN")} VNĐ / {product.unit}</p></div><div><p className="text-gray-500">Tồn kho</p><p className="mt-1 font-semibold">{product.stock}</p></div><div><p className="text-gray-500">Mác thép</p><p className="mt-1 font-semibold">{product.steelGrade || "Chưa cập nhật"}</p></div><div><p className="text-gray-500">Danh mục</p><p className="mt-1 font-semibold">{product.category || product.category_id}</p></div><div className="sm:col-span-2"><p className="text-gray-500">Mô tả</p><p className="mt-1 whitespace-pre-wrap leading-7">{product.description || "Chưa có mô tả."}</p></div></section></article>
}

