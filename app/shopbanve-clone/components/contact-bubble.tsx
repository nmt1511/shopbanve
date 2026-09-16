"use client"

import Link from "next/link"
import { MessageCircle, X } from "lucide-react"
import { useState } from "react"

export default function ContactBubble() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-orange-100 bg-white p-4 shadow-2xl shadow-slate-900/15">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#172554]">Cần tìm tài liệu?</p>
              
            </div>
            <button type="button" aria-label="Đóng liên hệ" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link href="/lien-he" onClick={() => setOpen(false)} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
            Gửi yêu cầu tìm tài liệu
          </Link>
        </div>
      )}
      <button type="button" aria-expanded={open} aria-label={open ? "Đóng hộp liên hệ" : "Mở hộp liên hệ"} onClick={() => setOpen((value) => !value)} className="group flex min-h-14 items-center gap-3 rounded-full bg-[#f97316] px-4 text-white shadow-xl shadow-orange-500/30 transition hover:-translate-y-1 hover:bg-orange-600">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><span className="absolute inset-0 animate-ping rounded-full bg-white/20" /><MessageCircle className="relative h-5 w-5" /></span>
        <span className="hidden text-sm font-bold sm:block">Liên hệ ngay</span>
      </button>
    </div>
  )
}
