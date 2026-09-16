import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import Providers from "./providers"
import "./globals.css"

export const metadata: Metadata = {
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
