"use client"

import type { ReactNode } from "react"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/firebase-auth"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>{children}</Suspense>
    </AuthProvider>
  )
}
