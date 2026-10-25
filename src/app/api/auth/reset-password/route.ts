import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string
    otp?: string
    new_password?: string
  }

  const email = body.email?.trim().toLowerCase()
  const otp = body.otp?.trim()
  const newPassword = body.new_password

  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const user = await prisma.user_profiles.findUnique({ where: { email } })

  if (!user || !user.otp_code || user.otp_code !== otp) {
    return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
  }

  if (user.otp_expires_at && user.otp_expires_at < new Date()) {
    return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user_profiles.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      otp_code: null,
      otp_expires_at: null,
    },
  })

  return NextResponse.json({ message: "Password reset successfully" })
}
