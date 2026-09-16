"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react"
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
  footerDescription: "Nền tảng tài liệu giúp bạn tìm kiếm, học tập và làm việc với dự án hiệu quả hơn.",
  footerSupportTitle: "Nhận cập nhật mới",
  footerSupportText: "Đăng ký để không bỏ lỡ tài nguyên và bài viết hữu ích.",
  footerSupportButtonLabel: "Liên hệ để nhận cập nhật",
}

export default function Footer() {
  const [settings, setSettings] = useState<ShopContactSettings>(fallbackSettings)

  useEffect(() => {
    return ShopBanVeRepository.onContactSettingsChange((value) => {
      if (value) setSettings(value)
    })
  }, [])

  return (
    <footer className="bg-[#172554] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f97316] text-sm font-black">SB</span><span className="text-lg font-black">{settings.shopName.toUpperCase()}</span></div><p className="mt-5 max-w-sm text-sm leading-7 text-blue-200">{settings.footerDescription}</p><div className="mt-6 flex gap-3"><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-lg bg-white/10 p-2.5 transition hover:bg-[#f97316]"><Facebook className="h-4 w-4" /></a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-lg bg-white/10 p-2.5 transition hover:bg-[#f97316]"><Instagram className="h-4 w-4" /></a></div></div>
          <div><h3 className="font-bold">Khám phá</h3><nav className="mt-5 space-y-3 text-sm text-blue-200"><Link className="block hover:text-orange-300" href="/danh-muc">Danh mục tài liệu</Link><Link className="block hover:text-orange-300" href="/do-an">Dự án & đồ án</Link><Link className="block hover:text-orange-300" href="/bai-viet">Kiến thức</Link></nav></div>
          <div><h3 className="font-bold">Hỗ trợ</h3><nav className="mt-5 space-y-3 text-sm text-blue-200"><Link className="block hover:text-orange-300" href="/huong-dan">Hướng dẫn sử dụng</Link><Link className="block hover:text-orange-300" href="/huong-dan#cau-hoi">Câu hỏi thường gặp</Link><Link className="block hover:text-orange-300" href="/chinh-sach-bao-mat">Chính sách bảo mật</Link></nav></div>
          <div><h3 className="font-bold">{settings.footerSupportTitle}</h3><p className="mt-3 text-sm leading-6 text-blue-200">{settings.footerSupportText}</p><Link href="/lien-he" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-500">{settings.footerSupportButtonLabel} <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-7 text-xs text-blue-300 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {settings.shopName}. All rights reserved.</p><div className="flex flex-wrap gap-5"><a className="flex items-center gap-1.5 hover:text-white" href={settings.email ? `mailto:${settings.email}` : "/lien-he"}><Mail className="h-3.5 w-3.5" />{settings.email || "Liên hệ qua form"}</a><a className="flex items-center gap-1.5 hover:text-white" href={settings.phone ? `tel:${settings.phone}` : "/lien-he"}><Phone className="h-3.5 w-3.5" />{settings.phone || "Chưa cập nhật"}</a><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Việt Nam</span></div></div>
      </div>
    </footer>
  )
}
