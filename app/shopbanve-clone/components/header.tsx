"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, Search, ShoppingCart, X } from "lucide-react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { ShopCategory, ShopMenuItem } from "@/lib/shopbanve/types"

const defaultMenuItems: ShopMenuItem[] = [
  { id: "home", label: "Trang chủ", href: "/", enabled: true, order: 1 },
  { id: "catalog", label: "Danh mục tài liệu", href: "/danh-muc", enabled: true, order: 2 },
  { id: "projects", label: "Dự án & đồ án", href: "/do-an", enabled: true, order: 3 },
  { id: "knowledge", label: "Kiến thức", href: "/bai-viet", enabled: true, order: 4 },
]
const defaultAnnouncement = "TẢI BẢN VẼ NHANH CHÓNG · FILE CHUẨN KỸ THUẬT · HỖ TRỢ 24/7"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuItems, setMenuItems] = useState(defaultMenuItems)
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [announcement, setAnnouncement] = useState({ enabled: true, text: defaultAnnouncement })
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    ShopBanVeRepository.getContactSettings().then((settings) => {
      if (!active || !settings) return
      if (settings.menuItems?.length) setMenuItems(settings.menuItems.filter((item) => item.enabled).sort((a, b) => a.order - b.order))
      setAnnouncement({ enabled: settings.announcementEnabled !== false, text: settings.announcementText || defaultAnnouncement })
    }).catch(() => undefined)
    ShopBanVeRepository.getCategories().then((items) => { if (active) setCategories(items.filter((item) => item.status === "active").sort((a, b) => a.order - b.order)) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white">
      {announcement.enabled && <div className="bg-[#172554] px-4 py-2 text-center text-xs font-medium tracking-wide text-blue-100">{announcement.text}</div>}

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

        <form onSubmit={(event) => { event.preventDefault(); window.location.href = query.trim() ? `/tim-kiem?q=${encodeURIComponent(query.trim())}` : "/tim-kiem" }} className="hidden min-w-0 flex-1 max-w-xl items-center lg:flex">
          <div className="flex h-11 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-orange-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm dự án, đồ án, luận văn..." className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
            <button className="rounded-md bg-[#f97316] px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600">Tìm kiếm</button>
          </div>
        </form>

        <nav className="hidden items-center gap-7 lg:flex">
          {menuItems.map((item) => item.id === "catalog" && categories.length > 0 ? <div key={item.label} className="group relative"><Link href={item.href} className="flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-[#f97316]">{item.label}<ChevronDown className="h-3.5 w-3.5" /></Link><div className="invisible absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">{categories.map((category) => <Link key={category.id} href={`/danh-muc?category=${category.id}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-orange-50 hover:text-[#f97316]">{category.name}</Link>)}</div></div> : <Link key={item.label} href={item.href} className="flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-[#f97316]">{item.label}</Link>)}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/tim-kiem" aria-label="Tìm kiếm" className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#f97316]">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/gio-hang" aria-label="Giỏ hàng" className="relative rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#f97316]">
            <ShoppingCart className="h-5 w-5" />
          </Link>
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
              <div key={item.label}>
                <Link href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316]">
                  {item.label}
                  {item.id === "catalog" && categories.length > 0 && <ChevronDown className="h-4 w-4" />}
                </Link>
                {item.id === "catalog" && categories.length > 0 && <div className="ml-3 border-l border-orange-100 pl-3">{categories.map((category) => <Link key={category.id} href={`/danh-muc?category=${category.id}`} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-orange-50 hover:text-[#f97316]">{category.name}</Link>)}</div>}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
