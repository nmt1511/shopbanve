export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-label="Đang tải trang quản trị">
      <div className="space-y-2"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="h-4 w-72 animate-pulse rounded bg-slate-100" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />)}</div>
      <div className="h-72 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />
    </div>
  )
}
