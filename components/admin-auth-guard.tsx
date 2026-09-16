"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase-auth"
import { FirebaseDB } from "@/lib/firebase-db"
import { Loader2 } from "lucide-react"

const configuredAdminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

// Fail closed: a missing bypass flag must never expose the admin area.
const adminAuthBypass = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ADMIN_AUTH_BYPASS === "true"

function hasAdminClaim(claims: Record<string, unknown>) {
  return claims.admin === true || claims.role === "admin" || claims.isAdmin === true
}

function hasAdminProfile(profile: { role?: string; permissions?: string[] } | null) {
  return profile?.role === "admin" || profile?.permissions?.includes("admin") === true
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  if (adminAuthBypass) return <>{children}</>

  useEffect(() => {
    let active = true
    const checkAccess = async () => {
      if (loading) return
      if (!user) {
        if (active) { setCheckingRole(false); setAuthorized(false) }
        router.replace("/admin/login")
        return
      }
      try {
        const token = await user.getIdTokenResult()
        const emailAuthorized = Boolean(user.email && configuredAdminEmails.includes(user.email.toLowerCase()))
        const claimAuthorized = hasAdminClaim(token.claims)
        let profileAuthorized = false

        if (!claimAuthorized && !emailAuthorized) {
          try {
            profileAuthorized = hasAdminProfile(await FirebaseDB.getUser(user.uid))
          } catch {
            // A profile read can be denied by Rules; claims/email authorization still apply.
          }
        }

        const allowed = claimAuthorized || profileAuthorized || emailAuthorized
        if (active) { setAuthorized(allowed); setCheckingRole(false) }
        if (!allowed) router.replace("/")
      } catch {
        if (active) { setAuthorized(false); setCheckingRole(false) }
        router.replace("/")
      }
    }
    checkAccess()
    return () => { active = false }
  }, [loading, router, user])

  if (loading || checkingRole) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (!user || !authorized) return null
  return <>{children}</>
}
