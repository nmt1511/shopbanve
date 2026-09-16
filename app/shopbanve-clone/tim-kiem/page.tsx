"use client"

import { useSearchParams } from "next/navigation"
import { CatalogGrid, PageIntro, SearchPanel } from "../components/site-page"
import ShopShell from "../components/shop-shell"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  return <ShopShell><PageIntro eyebrow="Tìm kiếm" title="Tìm tài liệu bạn cần" description="Sử dụng từ khóa cụ thể để tìm bản vẽ, đồ án và tài liệu hướng dẫn trong thư viện." /><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SearchPanel /><div className="mt-10"><p className="text-sm font-medium text-slate-500">{query ? `Kết quả cho “${query}”` : "Kết quả gợi ý"}</p><div className="mt-6"><CatalogGrid query={query} /></div></div></section></ShopShell>
}
