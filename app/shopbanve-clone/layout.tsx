import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop Bản Vẽ | Kho dự án, đồ án và luận văn kỹ thuật",
  description: "Tìm dự án, đồ án, luận văn, bản vẽ và tài liệu tham khảo kỹ thuật theo từng chuyên ngành.",
  alternates: { canonical: "/" },
}

export default function CloneLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
