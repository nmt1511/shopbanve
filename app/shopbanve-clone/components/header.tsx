"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, Search, ShoppingCart, X } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopMenuItem } from "@/lib/shopbanve/types"

const utilityItems = [
  { label: "Hướng dẫn", href: "/huong-dan" },
  { label: "Liên hệ", href: "/lien-he" },
]

const defaultMenuItems: ShopMenuItem[] = [
  { id: "home", label: "Trang chủ", href: "/", enabled: true, order: 1 },
  { id: "catalog", label: "Danh mục tài liệu", href: "/danh-muc", enabled: true, order: 2 },
  { id: "projects", label: "Dự án & đồ án", href: "/do-an", enabled: true, order: 3 },
  { id: "knowledge", label: "Kiến thức", href: "/bai-viet", enabled: true, order: 4 },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuItems, setMenuItems] = useState(defaultMenuItems)

  useEffect(() => {
    let active = true
    ShopBanVeRepository.getContactSettings().then((settings) => {
      if (!active || !settings?.menuItems?.length) return
      setMenuItems(settings.menuItems.filter((item) => item.enabled).sort((a, b) => a.order - b.order))
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      <div className="bg-[#172554] px-4 py-2 text-center text-xs font-medium tracking-wide text-blue-100">
        TẢI BẢN VẼ NHANH CHÓNG · FILE CHUẨN KỸ THUẬT · HỖ TRỢ 24/7
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f97316] text-xl font-black text-white shadow-lg shadow-orange-200">
            SB
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight text-[#172554]">SHOP BẢN VẼ</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Kho dự án & tài liệu kỹ thuật</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-[#f97316]"
            >
              {item.label}
              {item.id === "catalog" && <ChevronDown className="h-3.5 w-3.5" />}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/tim-kiem" aria-label="Tìm kiếm" className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#f97316]">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/gio-hang" aria-label="Giỏ hàng" className="relative rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#f97316]">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {utilityItems.map((item) => <Link key={item.href} href={item.href} className="text-xs font-semibold text-slate-500 hover:text-[#f97316]">{item.label}</Link>)}
        </div>

        <button
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316]"
              >
                {item.label}
              </Link>
            ))}
            {utilityItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316]">{item.label}</Link>)}
          </nav>
        </div>
      )}
    </header>
  )
}
