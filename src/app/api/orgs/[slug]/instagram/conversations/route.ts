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
  const filter = searchParams.get("filter")
  const search = searchParams.get("search") ?? ""
  const cursor = searchParams.get("cursor")
  const limit = 30

  const where = {
    org_id: access.org.id,
    is_archived: filter === "archived" ? true : false,
    ...(filter === "unread" ? { unread_count: { gt: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { ig_user_id: { contains: search } },
          ],
        }
      : {}),
    ...(cursor ? { last_message_at: { lt: new Date(cursor) } } : {}),
  }

  const conversations = await prisma.instagram_conversations.findMany({
    where,
    orderBy: { last_message_at: "desc" },
    take: limit,
  })

  return NextResponse.json({
    conversations,
    nextCursor:
      conversations.length === limit
        ? conversations[conversations.length - 1].last_message_at?.toISOString()
        : null,
  })
}
