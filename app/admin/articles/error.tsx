"use client"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-xl py-20 text-center"><h1 className="text-2xl font-bold">Không thể tải bài viết</h1><p className="mt-3 text-sm text-gray-500">Kiểm tra kết nối Firebase rồi thử lại.</p><button type="button" onClick={reset} className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Thử lại</button></section>
}
