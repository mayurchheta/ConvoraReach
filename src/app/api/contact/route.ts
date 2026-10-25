import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string; email?: string; message?: string }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const message = body.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  // Store in DB via raw query (no dedicated model needed — use a simple table)
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await prisma.$executeRaw`
    INSERT INTO contact_submissions (name, email, message) VALUES (${name}, ${email}, ${message})
  `

  console.log(`[contact] New submission from ${name} <${email}>: ${message.slice(0, 100)}`)

  return NextResponse.json({ ok: true })
}
