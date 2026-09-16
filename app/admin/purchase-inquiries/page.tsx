"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { InquiryStatus, PurchaseInquiry } from "@/lib/shopbanve/types"
import { useAuth } from "@/lib/firebase-auth"

const statuses: Array<{ value: InquiryStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "processing", label: "Đang xử lý" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "closed", label: "Đã đóng" },
  { value: "spam", label: "Spam" },
]

export default function PurchaseInquiriesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PurchaseInquiry[]>([])
  const [filter, setFilter] = useState<InquiryStatus | "all">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    ShopBanVeRepository.getPurchaseInquiries()
      .then((nextItems) => {
        if (active) setItems(nextItems)
      })
      .catch(() => {
        if (active) setError("Không thể tải yêu cầu mua.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = ShopBanVeRepository.onPurchaseInquiriesChange((nextItems) => {
      if (active) setItems(nextItems)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const filtered = useMemo(
    () =>
      items
        .filter((item) => filter === "all" || item.status === filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, filter],
  )

  const updateStatus = async (id: string, status: InquiryStatus) => {
    setError("")
    try {
      await ShopBanVeRepository.updatePurchaseInquiryStatus(id, status, user?.uid)
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể cập nhật trạng thái yêu cầu.")
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Yêu cầu mua bản vẽ</h1>
        <p className="mt-1 text-gray-600">Theo dõi các yêu cầu gửi từ Zalo và form tư vấn.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setFilter(status.value)}
            className={`min-h-10 rounded-full px-3 py-2 text-sm font-semibold ${filter === status.value ? "bg-blue-600 text-white" : "border bg-white text-gray-600"}`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Bản vẽ</th>
              <th className="px-4 py-3">Kênh</th>
              <th className="px-4 py-3">Ngày gửi</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <p className="font-semibold">{item.fullName}</p>
                  <p className="text-xs text-gray-500">{item.email} · {item.phone}</p>
                </td>
                <td className="px-4 py-4">
                  {item.drawingTitle}
                  <p className="mt-1 max-w-xs truncate text-xs text-gray-500">{item.message}</p>
                </td>
                <td className="px-4 py-4 text-xs font-bold uppercase">{item.source}</td>
                <td className="px-4 py-4 text-gray-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                <td className="px-4 py-4">
                  <select
                    value={item.status}
                    onChange={(event) => updateStatus(item.id!, event.target.value as InquiryStatus)}
                    className="h-9 rounded-md border px-2 text-sm"
                  >
                    <option value="new">Mới</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="contacted">Đã liên hệ</option>
                    <option value="closed">Đã đóng</option>
                    <option value="spam">Spam</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-500">Chưa có yêu cầu phù hợp.</p>
        )}
      </div>
    </div>
  )
}
