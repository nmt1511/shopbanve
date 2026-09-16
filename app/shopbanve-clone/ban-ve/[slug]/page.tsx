"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Check, Download, FileArchive, FileText, Loader2, ShieldCheck } from "lucide-react"
import ShopShell from "../../components/shop-shell"
import PurchaseOptions from "./purchase-options"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"
import type { Drawing } from "@/lib/shopbanve/types"

function formatPrice(drawing: Drawing) {
  if (drawing.priceType === "free") return "Miễn phí"
  if (drawing.priceType === "contact") return "Liên hệ báo giá"
  return `${drawing.price.toLocaleString("vi-VN")}đ`
}

export default function DrawingDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedImage, setSelectedImage] = useState(0)
  const [related, setRelated] = useState<Drawing[]>([])

  useEffect(() => {
    if (!slug) return
    let active = true
    setLoading(true)
    ShopBanVeRepository.getDrawingBySlug(slug)
      .then((remoteDrawing) => {
        if (!active) return
        const currentDrawing = remoteDrawing
        setDrawing(currentDrawing)
        if (currentDrawing) {
          const orderedImages = currentDrawing.images.slice().sort((a, b) => a.sortOrder - b.sortOrder)
          const coverIndex = currentDrawing.coverImageId
            ? orderedImages.findIndex((image) => image.id === currentDrawing.coverImageId)
            : -1
          setSelectedImage(coverIndex >= 0 ? coverIndex : 0)
          ShopBanVeRepository.getRelatedDrawings(currentDrawing).then((items) => { if (active) setRelated(items) }).catch(() => undefined)
          if (currentDrawing.id) ShopBanVeRepository.incrementDrawingViewCount(currentDrawing.id).catch(() => undefined)
        }
      })
      .catch((error) => {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : "Không thể tải thông tin tài liệu.")
        setDrawing(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const images = useMemo(() => drawing?.images.slice().sort((a, b) => a.sortOrder - b.sortOrder) ?? [], [drawing])

  if (loading) return <ShopShell><div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4"><Loader2 className="h-8 w-8 animate-spin text-[#f97316]" /><span className="sr-only">Đang tải bản vẽ</span></div></ShopShell>
  if (!drawing) return <ShopShell><section className="mx-auto max-w-2xl px-4 py-24 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Không tìm thấy</p><h1 className="mt-3 text-3xl font-black text-[#172554]">Tài liệu này không còn khả dụng</h1><p className="mt-4 text-slate-500">{loadError || "Hãy quay lại thư viện để xem các tài liệu khác."}</p><Link href="/danh-muc" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172554] px-5 py-3 text-sm font-bold text-white"> <ArrowLeft className="h-4 w-4" /> Về thư viện</Link></section></ShopShell>

  const activeImage = images[selectedImage] ?? images[0]

  return <ShopShell><section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Link href="/danh-muc" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#f97316]"><ArrowLeft className="h-4 w-4" /> Quay lại thư viện</Link>{loadError && <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">Đang hiển thị bản xem trước: {loadError}</p>}<div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12"><div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><img src={activeImage?.url ?? "/placeholder.svg"} alt={activeImage?.alt ?? drawing.title} className="aspect-[1.35] h-full w-full object-cover" /></div>{images.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{images.map((image, index) => <button type="button" key={image.id} aria-label={`Xem ảnh ${index + 1}`} onClick={() => setSelectedImage(index)} className={`min-w-20 overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-[#f97316]" : "border-transparent"}`}><img src={image.url} alt="" className="aspect-square h-20 w-20 object-cover" /></button>)}</div>}<div className="mt-6 grid grid-cols-3 gap-3">{[[FileText, drawing.formats[0] || "CAD"], [FileArchive, drawing.formats[1] || "PDF"], [Download, drawing.sizeLabel || "Xem file"]].map(([Icon, label]) => { const DetailIcon = Icon as typeof FileText; return <div key={label as string} className="rounded-xl bg-blue-50 p-4 text-center"><DetailIcon className="mx-auto h-5 w-5 text-[#f97316]" /><p className="mt-2 text-xs font-bold text-[#172554]">{label as string}</p></div> })}</div></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Tài liệu kỹ thuật · {drawing.tags[0] || "Tài liệu"}</p><h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#172554] sm:text-4xl">{drawing.title}</h1><p className="mt-5 text-base leading-8 text-slate-500">{drawing.description}</p><div className="mt-8 flex items-end justify-between gap-4 border-y border-slate-200 py-6"><div><p className="text-sm text-slate-400">Giá tài liệu</p><p className="mt-1 text-3xl font-black text-[#f97316]">{formatPrice(drawing)}</p></div><span className="text-right text-sm font-semibold tabular-nums text-slate-500">{drawing.viewCount.toLocaleString("vi-VN")} lượt xem</span></div><PurchaseOptions drawing={drawing} /><div className="mt-8 space-y-4">{["Thông tin định dạng và phiên bản được ghi rõ", "Có thể xem trước gallery trước khi liên hệ", "Hỗ trợ tư vấn sau khi gửi yêu cầu"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-medium text-slate-600"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> {item}</p>)}</div><div className="mt-8 flex gap-3 rounded-xl bg-orange-50 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-[#f97316]" /><p className="text-xs leading-5 text-slate-600">Gửi yêu cầu không đồng nghĩa với thanh toán thành công. Shop sẽ xác nhận thông tin và báo giá trực tiếp.</p></div></div></div>{related.length > 0 && <section className="mt-16 border-t border-slate-200 pt-10"><h2 className="text-2xl font-black text-[#172554]">Có thể bạn cũng quan tâm</h2><div className="mt-6 grid gap-5 sm:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/ban-ve/${item.slug}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-200 hover:shadow-md"><img src={item.images[0]?.url || "/placeholder.svg"} alt={item.images[0]?.alt || item.title} className="aspect-[1.5] w-full rounded-lg object-cover" /><h3 className="mt-3 font-bold text-[#172554]">{item.title}</h3><p className="mt-2 text-sm font-semibold text-[#f97316]">{formatPrice(item)}</p></Link>)}</div></section>}</section></ShopShell>
}
