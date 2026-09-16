"use client"

import { FormEvent, useEffect, useState } from "react"
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react"
import { PageIntro } from "../components/site-page"
import ShopShell from "../components/shop-shell"
import { FirebaseDB } from "@/lib/firebase-db"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopContactSettings } from "@/lib/shopbanve/types"

const fallbackSettings: ShopContactSettings = {
  shopName: "Shop Bản Vẽ",
  email: "",
  phone: "",
  zaloEnabled: false,
  zaloUrl: "",
  zaloPhone: "",
  zaloMessageTemplate: "Tôi muốn được tư vấn.",
  inquiryEnabled: true,
  updatedAt: "",
}

export default function ContactPage() {
  const [settings, setSettings] = useState<ShopContactSettings>(fallbackSettings)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    return ShopBanVeRepository.onContactSettingsChange((value) => {
      if (value) setSettings(value)
    })
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(false)
    setError("")
    if (submitting) return
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const customerName = String(form.get("customerName") || "").trim()
    const customerEmail = String(form.get("customerEmail") || "").trim()
    const message = String(form.get("message") || "").trim()

    if (customerName.length < 2 || !customerEmail || message.length < 10) {
      setError("Vui lòng nhập họ tên, email hợp lệ và nội dung từ 10 ký tự.")
      setSubmitting(false)
      return
    }

    try {
      await FirebaseDB.addContact({
        customer_name: customerName,
        customer_email: customerEmail,
        subject: "Yêu cầu hỗ trợ Shop Bản Vẽ",
        message,
        status: "new",
        priority: "medium",
        source: "website",
      })
      event.currentTarget.reset()
      setSent(true)
    } catch {
      setError("Không thể gửi yêu cầu lúc này. Vui lòng thử lại hoặc liên hệ trực tiếp qua email.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ShopShell>
      <PageIntro
        eyebrow="Liên hệ"
        title="Bạn đang tìm một tài liệu cụ thể?"
        description="Gửi cho chúng tôi tên dự án, đề tài hoặc tài liệu bạn cần. Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
        <div className="rounded-2xl bg-[#172554] p-7 text-white sm:p-9">
          <h2 className="text-2xl font-black">Kênh hỗ trợ</h2>
          <div className="mt-10 space-y-6 text-sm text-blue-100">
            <p className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-orange-300" />{settings.email || "Liên hệ qua form"}</p>
            <p className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-orange-300" />{settings.phone || "Chưa cập nhật"}</p>
            <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-orange-300" />Việt Nam</p>
          </div>
          {settings.zaloEnabled && (settings.zaloUrl || settings.zaloPhone) && <a href={settings.zaloUrl || `https://zalo.me/${settings.zaloPhone}`} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-[#f97316] px-4 py-3 text-sm font-bold text-white hover:bg-orange-600">Liên hệ Zalo</a>}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
          <h2 className="text-2xl font-black text-[#172554]">Gửi yêu cầu</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Họ tên</span>
              <input name="customerName" required minLength={2} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input name="customerEmail" required type="email" className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Bạn cần hỗ trợ gì?</span>
            <textarea name="message" required minLength={10} rows={6} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" placeholder="Mô tả tên dự án, đồ án hoặc tài liệu bạn đang tìm..." />
          </label>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {sent && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Yêu cầu đã được ghi nhận. Chúng tôi sẽ phản hồi sớm nhất.</p>}
          <button disabled={submitting} className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-[#172554] px-6 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      </section>
    </ShopShell>
  )
}
