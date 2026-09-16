"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react"
import ShopShell from "../components/shop-shell"
import { useAuth } from "@/lib/firebase-auth"

function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : ""
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "Email hoặc mật khẩu không chính xác."
  if (code === "auth/invalid-email") return "Email không hợp lệ."
  if (code === "auth/too-many-requests") return "Có quá nhiều lần thử. Vui lòng thử lại sau."
  if (code === "auth/network-request-failed") return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng."
  return "Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại."
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      router.replace("/")
      router.refresh()
    } catch (error) {
      setMessage(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return <ShopShell><section className="mx-auto flex max-w-7xl justify-center px-4 py-16 sm:px-6 lg:py-24"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f97316]">Tài khoản</p><h1 className="mt-3 text-3xl font-black tracking-tight text-[#172554]">Đăng nhập</h1><p className="mt-3 text-sm leading-6 text-slate-500">Lưu lại tài liệu yêu thích và xem lịch sử tải của bạn.</p></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><span className="relative block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" placeholder="ban@example.com" /></span></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-orange-100" placeholder="Tối thiểu 6 ký tự" /></span></label>{message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700">{message}</p>}<button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#172554] text-sm font-bold text-white transition hover:bg-blue-900 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Đăng nhập {!submitting && <ArrowRight className="h-4 w-4" />}</button></form><div className="mt-7 flex justify-between text-sm font-semibold"><Link href="/dang-ky" className="text-[#f97316] hover:text-orange-600">Tạo tài khoản</Link><Link href="/" className="text-slate-500 hover:text-[#172554]">Về trang chủ</Link></div></div></section></ShopShell>
}
