import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-full"
import { prisma } from "@/lib/prisma"

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user: { id: session.user.id, email: session.user.email! } }
}

export async function verifyOrgAccess(slug: string) {
  const authResult = await getAuthUser()
  if ("error" in authResult) return { error: authResult.error }

  const { user } = authResult
  const org = await prisma.organizations.findUnique({ where: { slug } })
  if (!org) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) }
  }

  const [membership, profile] = await Promise.all([
    prisma.org_memberships.findUnique({
      where: { user_id_org_id: { user_id: user.id, org_id: org.id } },
      select: { id: true, role: true, is_active: true },
    }),
    prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { is_super_admin: true },
    }),
  ])

  const isSuperAdmin = profile?.is_super_admin ?? false
  const activeMembership = membership?.is_active ? membership : null

  if (!activeMembership && !isSuperAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, org, membership: activeMembership, isSuperAdmin }
}

export async function verifyOrgAdmin(slug: string) {
  const authResult = await getAuthUser()
  if ("error" in authResult) return { error: authResult.error }

  const { user } = authResult
  const org = await prisma.organizations.findUnique({ where: { slug } })
  if (!org) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) }
  }

  const [membership, profile] = await Promise.all([
    prisma.org_memberships.findUnique({
      where: { user_id_org_id: { user_id: user.id, org_id: org.id } },
      select: { id: true, role: true, is_active: true },
    }),
    prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { is_super_admin: true },
    }),
  ])

  const isSuperAdmin = profile?.is_super_admin ?? false

  if (!isSuperAdmin && (!membership?.is_active || membership.role !== "org_admin")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, org, isSuperAdmin }
}
