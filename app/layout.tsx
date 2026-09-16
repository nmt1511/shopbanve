import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import Providers from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://shopbanve.com"),
  keywords: ["dự án xây dựng", "đồ án kỹ thuật", "luận văn", "bản vẽ CAD", "tài liệu kỹ thuật"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "vi_VN", siteName: "Shop Bản Vẽ" },
  robots: { index: true, follow: true },
  title: "Shop Bản Vẽ - Kho dự án, đồ án và tài liệu kỹ thuật",
  description: "Tìm kiếm, tham khảo dự án, đồ án, luận văn và tài liệu kỹ thuật cho học tập và công việc.",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
