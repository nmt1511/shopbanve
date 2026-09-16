"use client"

import { useEffect, useState } from "react"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { HomepageOptions, HomepageSection } from "@/lib/shopbanve/types"
import HeroSlider from "./hero-slider"
import ProductsSection from "./products-section"
import NewsSection from "./news-section"
import { SearchPanel } from "./site-page"

const defaultSections: HomepageSection[] = [
  { id: "search", label: "Tìm kiếm", enabled: true, order: 1 },
  { id: "hero", label: "Hero banner", enabled: true, order: 2 },
  { id: "library", label: "Thư viện tài liệu", enabled: true, order: 3 },
  { id: "articles", label: "Bài viết & kiến thức", enabled: true, order: 4 },
]
const defaultOptions: HomepageOptions = { showDailyUpdate: true, showCategoryLink: true, showArticleLink: true, dailyUpdateOrder: 1, categoryLinkOrder: 2, articleLinkOrder: 3 }

export default function HomepageSections() {
  const [sections, setSections] = useState(defaultSections)
  const [options, setOptions] = useState(defaultOptions)
  useEffect(() => {
    ShopBanVeRepository.getContactSettings().then((settings) => {
      if (settings?.homepageSections?.length) setSections(settings.homepageSections)
      if (settings?.homepageOptions) setOptions({ ...defaultOptions, ...settings.homepageOptions })
    }).catch(() => undefined)
  }, [])
  return <>{sections.filter((section) => section.enabled).sort((a, b) => a.order - b.order).map((section) => {
    if (section.id === "search") return <section key={section.id} className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><SearchPanel /></div></section>
    if (section.id === "hero") return <HeroSlider key={section.id} />
    if (section.id === "library") return <ProductsSection key={section.id} options={options} />
    return <NewsSection key={section.id} showArticleLink={options.showArticleLink} />
  })}</>
}
