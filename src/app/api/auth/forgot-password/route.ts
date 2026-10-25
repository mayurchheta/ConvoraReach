import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string }
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user_profiles.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "If an account exists, a reset code has been sent." })
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.user_profiles.update({
    where: { id: user.id },
    data: { otp_code: otp, otp_expires_at: expiresAt },
  })

  // Log the OTP for now (in production, send via email)
  console.log(`[auth] Password reset OTP for ${email}: ${otp}`)

  // TODO: Send email with OTP using nodemailer or similar
  // For now, the OTP is logged to server console

  return NextResponse.json({
    message: "If an account exists, a reset code has been sent.",
    // Include OTP in dev mode for testing
    ...(process.env.NODE_ENV === "development" ? { _dev_otp: otp } : {}),
  })
}
