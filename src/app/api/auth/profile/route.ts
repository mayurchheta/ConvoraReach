import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// GET: Fetch current user's profile
export async function GET() {
  const authResult = await getAuthUser()
  if ("error" in authResult) return authResult.error

  const user = await prisma.user_profiles.findUnique({
    where: { id: authResult.user.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      created_at: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}

// PUT: Update profile (name, email, password, avatar)
export async function PUT(req: NextRequest) {
  const authResult = await getAuthUser()
  if ("error" in authResult) return authResult.error

  const body = (await req.json()) as {
    full_name?: string
    email?: string
    avatar_url?: string | null
    current_password?: string
    new_password?: string
  }

  const updates: Record<string, unknown> = {}

  // Update name
  if (body.full_name !== undefined) {
    const name = body.full_name.trim()
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }
    updates.full_name = name
  }

  // Update email
  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 })
    }
    // Check uniqueness
    const existing = await prisma.user_profiles.findUnique({ where: { email } })
    if (existing && existing.id !== authResult.user.id) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    updates.email = email
  }

  // Update avatar
  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url
  }

  // Update password
  if (body.new_password) {
    if (!body.current_password) {
      return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 })
    }
    if (body.new_password.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    const user = await prisma.user_profiles.findUnique({
      where: { id: authResult.user.id },
      select: { password_hash: true },
    })

    if (!user?.password_hash) {
      return NextResponse.json({ error: "Cannot verify current password" }, { status: 400 })
    }

    const valid = await bcrypt.compare(body.current_password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 })
    }

    updates.password_hash = await bcrypt.hash(body.new_password, 10)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const updated = await prisma.user_profiles.update({
    where: { id: authResult.user.id },
    data: updates,
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
    },
  })

  return NextResponse.json({ user: updated })
}
