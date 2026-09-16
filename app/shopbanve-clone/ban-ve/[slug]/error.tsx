"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-2xl px-4 py-24 text-center"><h1 className="text-2xl font-bold text-[#172554]">Không thể tải bản vẽ</h1><p className="mt-3 text-slate-500">Đã có lỗi kết nối. Vui lòng thử lại.</p><button type="button" onClick={reset} className="mt-6 rounded-lg bg-[#172554] px-5 py-3 text-sm font-bold text-white">Thử lại</button></section>
}
