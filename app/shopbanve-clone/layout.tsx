import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop Bản Vẽ - Kho dự án, đồ án và tài liệu kỹ thuật",
  description: "Tìm kiếm, tham khảo dự án, đồ án, luận văn và tài liệu kỹ thuật cho học tập và công việc.",
}

export default function CloneLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
