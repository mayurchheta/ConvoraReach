import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const conversation = await prisma.instagram_conversations.findFirst({
    where: { id, org_id: access.org.id },
  })
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = 50

  const messages = await prisma.instagram_messages.findMany({
    where: {
      conversation_id: id,
      ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  })

  return NextResponse.json({
    conversation,
    messages: messages.reverse(),
    nextCursor:
      messages.length === limit
        ? messages[0].timestamp.toISOString()
        : null,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const updated = await prisma.instagram_conversations.updateMany({
    where: { id, org_id: access.org.id },
    data: { unread_count: 0 },
  })

  return NextResponse.json({ ok: updated.count > 0 })
}
