import { NextResponse } from "next/server"
import { z } from "zod"
import { ShopBanVeRepository } from "@/lib/shopbanve/repository"

const inquirySchema = z.object({ id: z.string().max(80), drawingTitle: z.string().max(180), fullName: z.string().max(120), email: z.string().max(180), phone: z.string().max(40), projectPurpose: z.string().max(240), message: z.string().max(2000) })

export async function POST(request: Request) {
  try {
    const input = inquirySchema.parse(await request.json())
    const settings = await ShopBanVeRepository.getContactSettings()
    if (!settings?.telegramBotEnabled || !settings.telegramBotToken || !settings.telegramChatId) return NextResponse.json({ sent: false })
    const text = ["YEU CAU TU VAN MOI", `Ma: ${input.id}`, `Tai lieu: ${input.drawingTitle}`, `Ho ten: ${input.fullName}`, `Email: ${input.email}`, `Dien thoai: ${input.phone}`, `Muc dich: ${input.projectPurpose}`, `Noi dung: ${input.message}`].join("\n")
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: settings.telegramChatId, text }), cache: "no-store" })
    return NextResponse.json({ sent: response.ok }, { status: response.ok ? 200 : 502 })
  } catch { return NextResponse.json({ sent: false }, { status: 400 }) }
}
