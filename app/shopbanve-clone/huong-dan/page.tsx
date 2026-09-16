import { Download, FileCheck2, HelpCircle, UserRound } from "lucide-react"
import { PageIntro } from "../components/site-page"
import ShopShell from "../components/shop-shell"

const steps = [
  [UserRound, "Tạo tài khoản", "Đăng ký bằng email để lưu tài liệu và quản lý lịch sử tải."],
  [FileCheck2, "Kiểm tra thông tin", "Đọc mô tả, định dạng, phiên bản phần mềm và kích thước file trước khi chọn."],
  [Download, "Tải tài liệu", "Sau khi hoàn tất quyền truy cập, tài liệu sẽ xuất hiện trong thư viện cá nhân."],
] as const

const questions = [
  "Tôi có thể xem trước bản vẽ không?",
  "Tài liệu được hỗ trợ định dạng nào?",
  "Tôi tìm lại tài liệu đã tải ở đâu?",
]

export default function GuidePage() {
  return (
    <ShopShell>
      <PageIntro
        eyebrow="Trung tâm hỗ trợ"
        title="Hướng dẫn sử dụng"
        description="Một vài bước ngắn để bạn tìm và quản lý tài liệu kỹ thuật trong Shop Bản Vẽ."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(([Icon, title, description], index) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-black text-orange-300">0{index + 1}</p>
              <Icon className="mt-8 h-6 w-6 text-[#f97316]" />
              <h2 className="mt-4 text-xl font-bold text-[#172554]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
        <div id="cau-hoi" className="mt-14 max-w-3xl">
          <div className="flex gap-3">
            <HelpCircle className="h-6 w-6 shrink-0 text-[#f97316]" />
            <div>
              <h2 className="text-2xl font-black text-[#172554]">Câu hỏi thường gặp</h2>
              <div className="mt-6 space-y-5">
                {questions.map((question) => (
                  <details key={question} className="border-b border-slate-200 pb-5">
                    <summary className="cursor-pointer font-bold text-[#172554]">{question}</summary>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Thông tin chi tiết sẽ được cập nhật theo từng tài liệu và tài khoản của bạn.
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </ShopShell>
  )
}
