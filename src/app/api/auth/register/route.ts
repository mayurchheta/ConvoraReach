import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    full_name?: string
    email?: string
    password?: string
    org_name?: string
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const fullName = body.full_name?.trim()

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // Check if user already exists
  const existing = await prisma.user_profiles.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // Create user
  const user = await prisma.user_profiles.create({
    data: {
      email,
      password_hash: passwordHash,
      full_name: fullName,
    },
  })

  // Create org + membership
  const orgName = body.org_name?.trim() || `${fullName}'s Workspace`
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "workspace"

  // Ensure unique slug
  let finalSlug = slug
  let attempt = 0
  while (await prisma.organizations.findUnique({ where: { slug: finalSlug } })) {
    attempt++
    finalSlug = `${slug}-${attempt}`
  }

  const org = await prisma.organizations.create({
    data: { name: orgName, slug: finalSlug },
  })

  await prisma.org_memberships.create({
    data: {
      user_id: user.id,
      org_id: org.id,
      role: "org_admin",
      is_active: true,
    },
  })

  return NextResponse.json(
    { ok: true, user_id: user.id, org_slug: finalSlug },
    { status: 201 }
  )
}
