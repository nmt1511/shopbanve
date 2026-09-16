"use client"

import Link from "next/link"
import { ArrowRight, FileText, ShoppingCart } from "lucide-react"
import { PageIntro } from "../components/site-page"
import ShopShell from "../components/shop-shell"
import { useAuth } from "@/lib/firebase-auth"

export default function CartPage() {
  const { user, loading } = useAuth()

  return (
    <ShopShell>
      <PageIntro
        eyebrow="Thư viện cá nhân"
        title="Giỏ tài liệu của bạn"
        description="Shop Bản Vẽ hiện tiếp nhận yêu cầu mua qua Zalo hoặc form tư vấn. Chưa có cổng thanh toán và quyền tải tự động nên không hiển thị đơn hàng giả."
      />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
            <div className="rounded-xl bg-orange-50 p-3 text-[#f97316]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[#172554]">Chưa có tài liệu được lưu</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Mở một bản vẽ để xem gallery và gửi yêu cầu mua. Sau khi shop xác nhận,
                chúng tôi sẽ hướng dẫn bước tiếp theo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-sm text-slate-500">
              {loading
                ? "Đang kiểm tra tài khoản..."
                : user
                  ? `Đã đăng nhập: ${user.email || "tài khoản của bạn"}`
                  : "Bạn có thể gửi yêu cầu mà không cần đăng nhập."}
            </p>
            <Link
              href="/danh-muc"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172554] px-5 py-3 text-sm font-bold text-white hover:bg-blue-900"
            >
              Xem thư viện <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-orange-50 p-5">
          <div className="flex gap-3">
            <ShoppingCart className="h-5 w-5 shrink-0 text-[#f97316]" />
            <p className="text-sm leading-6 text-slate-600">
              Không có thanh toán thành công hoặc quyền tải được tạo tại trang này.
              Hãy dùng nút “Mua bản vẽ / nhận báo giá” ở trang chi tiết để gửi yêu cầu thật.
            </p>
          </div>
        </div>
      </section>
    </ShopShell>
  )
}
