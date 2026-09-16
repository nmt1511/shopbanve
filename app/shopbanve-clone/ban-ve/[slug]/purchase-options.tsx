"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { ExternalLink, Loader2, MessageCircle, Send, X } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing, ShopContactSettings } from "@/lib/shopbanve/types"

const initialForm = { fullName: "", email: "", phone: "", company: "", projectPurpose: "", message: "", consent: false }

export default function PurchaseOptions({ drawing }: { drawing: Drawing }) {
  const [settings, setSettings] = useState<ShopContactSettings | null>(null)
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...initialForm })
  const [zaloPending, setZaloPending] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    return ShopBanVeRepository.onContactSettingsChange(setSettings)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>("button, input, textarea, select")
    firstFocusable?.focus()
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const openZalo = () => {
    setZaloPending(true)
    try {
      if (!settings?.zaloEnabled) {
        setError("Kênh Zalo hiện đang tạm tắt. Bạn có thể gửi form để chúng tôi liên hệ.")
        setOpen(true)
        return
      }
      if (!settings?.zaloUrl && !settings?.zaloPhone) {
        setError("Kênh Zalo chưa được cấu hình. Bạn có thể gửi form để chúng tôi liên hệ.")
        setOpen(true)
        return
      }
      const message = (settings.zaloMessageTemplate || "Tôi muốn hỏi về tài liệu: {title}").replace("{title}", drawing.title)
      const destination = settings.zaloUrl || `https://zalo.me/${settings.zaloPhone}`
      window.open(`${destination}${destination.includes("?") ? "&" : "?"}message=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
    } finally {
      setZaloPending(false)
    }
  }

  const activeChannels = settings?.contactChannels?.filter((channel) => channel.enabled) || (settings?.zaloEnabled ? [{ id: "zalo", label: "Zalo", url: settings.zaloUrl || "", enabled: true }] : [])

  const channelHref = (channel: NonNullable<ShopContactSettings["contactChannels"]>[number]) => {
    if (!channel.url.trim()) return `/lien-he?channel=${channel.id}`
    if (channel.id === "email" && !channel.url.startsWith("mailto:")) return `mailto:${channel.url}`
    if (channel.id === "phone" && !channel.url.startsWith("tel:")) return `tel:${channel.url}`
    return channel.url
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setError("")
    if (settings && !settings.inquiryEnabled) {
      setError("Form tư vấn hiện đang tạm tắt. Vui lòng liên hệ qua Zalo.")
      return
    }
    if (!form.consent) { setError("Bạn cần đồng ý để chúng tôi sử dụng thông tin cho việc tư vấn."); return }
    setSaving(true)
    try {
      const id = await ShopBanVeRepository.addPurchaseInquiry({ ...form, drawingId: drawing.id, drawingTitle: drawing.title, source: "form", status: "new" })
      setSubmitted(`Mã yêu cầu: ${id}`)
      setForm({ ...initialForm })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gửi yêu cầu. Vui lòng thử lại.")
    } finally { setSaving(false) }
  }

  return <>
    <div className="mt-7 rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-sm font-bold text-[#172554]">Muốn xem chi tiết tài liệu?</p><p className="mt-1 text-xs leading-5 text-slate-600">Liên hệ trực tiếp hoặc gửi form để được tư vấn.</p>{activeChannels.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{activeChannels.map((channel) => <a key={channel.id} href={channelHref(channel)} target={channel.id === "phone" || channel.id === "email" ? undefined : "_blank"} rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#172554] ring-1 ring-orange-200 transition hover:bg-[#f97316] hover:text-white">{channel.label}</a>)}</div>}</div><button ref={triggerRef} type="button" onClick={() => { setOpen(true); setSubmitted(""); setError("") }} className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#172554] px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-900 active:scale-[.98]"><MessageCircle className="h-5 w-5" /> Nhận tài liệu / nhận báo giá</button>
    {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f97316]">Liên hệ về tài liệu</p><h2 id="purchase-title" className="mt-2 text-xl font-black text-[#172554]">{drawing.title}</h2></div><button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{submitted ? <div className="mt-7 rounded-xl bg-emerald-50 p-5 text-sm leading-7 text-emerald-800"><p className="font-bold">Đã nhận yêu cầu</p><p className="mt-1">Chúng tôi sẽ liên hệ lại sớm. {submitted}</p><button type="button" onClick={() => setOpen(false)} className="mt-4 font-bold underline">Đóng</button></div> : <><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={openZalo} disabled={zaloPending} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#f97316] px-4 py-3 text-sm font-bold text-[#f97316] hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60">{zaloPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} {zaloPending ? "Đang mở..." : "Liên hệ qua Zalo"}</button><button type="button" onClick={() => document.getElementById("purchase-form")?.scrollIntoView({ behavior: "smooth" })} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 py-3 text-sm font-bold text-white hover:bg-blue-900"><Send className="h-4 w-4" /> Điền form</button></div><form id="purchase-form" onSubmit={submit} className="mt-7 space-y-4"><div className="grid gap-4 sm:grid-cols-2">{[["fullName", "Họ và tên *", "text"], ["email", "Email *", "email"], ["phone", "Số điện thoại *", "tel"], ["company", "Công ty / đơn vị", "text"]].map(([name, label, type]) => <label key={name} className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><input required={name !== "company"} type={type} value={form[String(name) as keyof typeof form] as string} onChange={(event) => setForm((current) => ({ ...current, [String(name)]: event.target.value }))} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" /></label>)}</div><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Mục đích sử dụng *</span><input required value={form.projectPurpose} onChange={(event) => setForm((current) => ({ ...current, projectPurpose: event.target.value }))} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" placeholder="Học tập, thi công, tham khảo..." /></label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Lời nhắn *</span><textarea required rows={4} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" /></label><label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-1 h-4 w-4 accent-orange-500" />Tôi đồng ý để Shop Bản Vẽ sử dụng thông tin này nhằm tư vấn yêu cầu.</label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f97316] px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Gửi yêu cầu tư vấn</button></form></>}</div></div>}
  </>
}
