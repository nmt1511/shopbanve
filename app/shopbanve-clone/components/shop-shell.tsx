import type { ReactNode } from "react"
import Header from "./header"
import Footer from "./footer"
import ContactBubble from "./contact-bubble"

export default function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <Header />
      <main>{children}</main>
      <Footer />
      <ContactBubble />
    </div>
  )
}
