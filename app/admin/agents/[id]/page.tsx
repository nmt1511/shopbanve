"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FirebaseDB, type Agent } from "@/lib/firebase-db"

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const id = params?.id
    if (!id) return
    FirebaseDB.getAgent(id)
      .then((item) => {
        if (!item) setError("Không tìm thấy đơn đăng ký đại lý.")
        setAgent(item)
      })
      .catch(() => setError("Không thể tải thông tin đại lý."))
      .finally(() => setLoading(false))
  }, [params?.id])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
  if (!agent) return <div className="space-y-4"><p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error || "Không tìm thấy đơn đăng ký đại lý."}</p><Link href="/admin/agents" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Link></div>

  return <div className="mx-auto max-w-3xl space-y-6"><button type="button" onClick={() => router.push("/admin/agents")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gray-600"><ArrowLeft className="h-4 w-4" /> Danh sách đại lý</button><div><h1 className="text-3xl font-bold text-gray-900">Chi tiết đăng ký đại lý</h1><p className="mt-1 text-gray-600">Thông tin đăng ký và trạng thái xử lý hiện tại.</p></div><section className="grid gap-4 rounded-lg border bg-white p-5 text-sm sm:grid-cols-2"><div><p className="text-gray-500">Họ tên</p><p className="mt-1 font-semibold">{agent.name}</p></div><div><p className="text-gray-500">Trạng thái</p><p className="mt-1 font-semibold">{agent.status}</p></div><div><p className="text-gray-500">Email</p><p className="mt-1 font-semibold">{agent.email}</p></div><div><p className="text-gray-500">Điện thoại</p><p className="mt-1 font-semibold">{agent.phone}</p></div><div><p className="text-gray-500">Công ty</p><p className="mt-1 font-semibold">{agent.company || "Chưa cập nhật"}</p></div><div><p className="text-gray-500">Loại hình</p><p className="mt-1 font-semibold">{agent.businessType || "Chưa cập nhật"}</p></div><div className="sm:col-span-2"><p className="text-gray-500">Địa chỉ</p><p className="mt-1 font-semibold">{agent.address || "Chưa cập nhật"}</p></div><div><p className="text-gray-500">Kinh nghiệm</p><p className="mt-1 font-semibold">{agent.experience || "Chưa cập nhật"}</p></div><div><p className="text-gray-500">Ngày đăng ký</p><p className="mt-1 font-semibold">{agent.createdAt ? new Date(agent.createdAt).toLocaleString("vi-VN") : "Chưa cập nhật"}</p></div></section></div>
}

