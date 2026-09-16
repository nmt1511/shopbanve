"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, Facebook, Instagram, Mail, MessageCircle, Phone, Send } from "lucide-react"
import { FirebaseDB, type Slider } from "@/lib/firebase-db"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopContactSettings } from "@/lib/shopbanve/types"

const fallbackSlides = [
  { title: "Dự án kiến trúc", image: "/industrial-steel-processing-equipment.jpg", link: "/danh-muc" },
  { title: "Đồ án và luận văn", image: "/modern-stainless-steel-architectural-structure-bui.jpg", link: "/do-an" },
  { title: "Tài liệu kỹ thuật", image: "/modern-stainless-steel-factory-with-industrial-equ.jpg", link: "/danh-muc" },
]

type HeroSlide = { title: string; image: string; link: string }

const channelStyles = {
  zalo: { icon: MessageCircle, className: "hover:border-sky-300 hover:bg-sky-50" },
  telegram: { icon: Send, className: "hover:border-sky-300 hover:bg-sky-50" },
  instagram: { icon: Instagram, className: "hover:border-pink-300 hover:bg-pink-50" },
  facebook: { icon: Facebook, className: "hover:border-blue-300 hover:bg-blue-50" },
  email: { icon: Mail, className: "hover:border-emerald-300 hover:bg-emerald-50" },
  phone: { icon: Phone, className: "hover:border-orange-300 hover:bg-orange-50" },
} as const

function mapSlider(slider: Slider): HeroSlide {
  return { title: slider.title, image: slider.image, link: slider.link || "/danh-muc" }
}

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides)
  const [settings, setSettings] = useState<ShopContactSettings | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([FirebaseDB.getActiveSliders(), ShopBanVeRepository.getContactSettings()]).then(([configured, contactSettings]) => {
      if (!active) return
      if (configured.length > 0) setSlides(configured.map(mapSlider))
      setSettings(contactSettings)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const slide = slides[activeSlide] ?? slides[0]!
  const channels = settings?.contactChannels?.filter((channel) => channel.enabled) || (settings?.zaloEnabled ? [{ id: "zalo", label: "Zalo", url: settings.zaloUrl || "", enabled: true }] : [])

  return (
    <section className="bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,.75fr)]">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/10">
          <div className="relative aspect-[16/7] min-h-52 sm:min-h-64">
            <Image src={slide.image} alt={slide.title} fill priority={activeSlide === 0} sizes="(min-width: 1024px) 68vw, 100vw" className="object-cover transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 sm:p-7"><h1 className="text-2xl font-black text-white sm:text-3xl">{slide.title}</h1><Link href={slide.link} className="hidden shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#172554] transition hover:bg-orange-50 sm:inline-flex">Xem chi tiết <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
          <button type="button" aria-label="Ảnh trước" onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white transition hover:bg-[#f97316]"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Ảnh tiếp theo" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-white transition hover:bg-[#f97316]"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-4 right-5 flex gap-1.5 sm:right-7">{slides.map((item, index) => <button key={item.title} type="button" aria-label={`Chuyển ảnh ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-8 bg-orange-400" : "w-3 bg-white/60"}`} />)}</div>
        </div>
        <aside className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-7">
          <div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]"><MessageCircle className="h-5 w-5" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#f97316]">Kênh liên hệ</p><h2 className="mt-2 text-2xl font-black leading-tight text-[#172554]">Liên hệ ngay</h2></div>
          <div className="mt-7"><div className="grid gap-2">{channels.slice(0, 3).map((channel) => { const meta = channelStyles[channel.id]; const ChannelIcon = meta.icon; return <a key={channel.id} href={channel.url || `/lien-he?channel=${channel.id}`} target={channel.url && channel.id !== "email" && channel.id !== "phone" ? "_blank" : undefined} rel="noreferrer" className={`flex min-h-11 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#172554] transition ${meta.className}`}><span className="flex items-center gap-2"><ChannelIcon className="h-4 w-4" />{channel.label}</span><ArrowRight className="h-4 w-4 text-[#f97316]" /></a> })}</div>{settings?.inquiryEnabled !== false && <Link href="/lien-he" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600">Gửi yêu cầu qua form <ArrowRight className="h-4 w-4" /></Link>}</div>
        </aside>
      </div>
    </section>
  )
}
