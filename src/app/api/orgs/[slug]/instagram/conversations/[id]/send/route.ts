import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess } from "@/lib/auth"
import { sendInstagramDM, getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function POST(
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

  const igConfig = await getOrgInstagramConfig(access.org.id)
  if (!igConfig) {
    return NextResponse.json({ error: "Instagram not connected" }, { status: 400 })
  }

  const body = await req.json() as { text: string }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  const now = new Date()

  const message = await prisma.instagram_messages.create({
    data: {
      conversation_id: id,
      ig_message_id: `pending_${now.getTime()}`,
      direction: "outbound",
      message_text: body.text,
      timestamp: now,
    },
  })

  try {
    const result = await sendInstagramDM(
      conversation.ig_user_id,
      body.text,
      igConfig.ig_account_id,
      igConfig.page_access_token,
      igConfig.api_base
    )

    const updatedMessage = await prisma.instagram_messages.update({
      where: { id: message.id },
      data: { ig_message_id: result.message_id },
    })

    await prisma.instagram_conversations.update({
      where: { id },
      data: {
        last_message_at: now,
        last_message_preview: body.text.slice(0, 80),
        updated_at: now,
      },
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (err) {
    await prisma.instagram_messages.delete({ where: { id: message.id } })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Message send failed" },
      { status: 500 }
    )
  }
}
