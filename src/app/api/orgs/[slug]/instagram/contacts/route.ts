import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const cursor = searchParams.get("cursor")
  const limit = 30

  const where = {
    org_id: access.org.id,
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { ig_user_id: { contains: search } },
          ],
        }
      : {}),
    ...(cursor ? { first_seen_at: { lt: new Date(cursor) } } : {}),
  }

  const [contacts, total] = await Promise.all([
    prisma.instagram_contacts.findMany({
      where,
      orderBy: { first_seen_at: "desc" },
      take: limit,
    }),
    prisma.instagram_contacts.count({ where: { org_id: access.org.id } }),
  ])

  return NextResponse.json({
    contacts,
    total,
    nextCursor:
      contacts.length === limit
        ? contacts[contacts.length - 1].first_seen_at.toISOString()
        : null,
  })
}
