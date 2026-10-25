import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAdmin } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "Instagram not connected" }, { status: 400 })
  }

  const apiBase = config.api_base || "https://graph.instagram.com/v21.0"
  const token = config.page_access_token

  try {
    const convsRes = await fetch(
      `${apiBase}/${config.ig_account_id}/conversations?fields=participants,updated_time&platform=instagram&limit=20&access_token=${encodeURIComponent(token)}`
    )
    const convsBody = (await convsRes.json()) as {
      data?: Array<{
        id: string
        participants: { data: Array<{ username: string; id: string }> }
        updated_time: string
      }>
      error?: { message?: string }
    }

    if (!convsBody.data) {
      return NextResponse.json({ error: convsBody.error?.message ?? "Failed to fetch conversations" }, { status: 502 })
    }

    // Clear old messages and conversations before fresh sync
    const oldConvIds = (await prisma.instagram_conversations.findMany({
      where: { org_id: access.org.id },
      select: { id: true },
    })).map(c => c.id)
    if (oldConvIds.length > 0) {
      await prisma.instagram_messages.deleteMany({ where: { conversation_id: { in: oldConvIds } } })
    }
    await prisma.instagram_conversations.deleteMany({ where: { org_id: access.org.id } })

    let synced = 0
    let messagesImported = 0

    for (const conv of convsBody.data) {
      const other = conv.participants.data.find(p => p.id !== config.ig_account_id)
      if (!other) continue
      if (conv.participants.data.length > 2) continue

      const conversation = await prisma.instagram_conversations.upsert({
        where: {
          org_id_ig_user_id: { org_id: access.org.id, ig_user_id: other.id },
        },
        create: {
          org_id: access.org.id,
          ig_user_id: other.id,
          username: other.username,
          last_message_at: new Date(conv.updated_time),
          unread_count: 0,
        },
        update: {
          username: other.username,
          last_message_at: new Date(conv.updated_time),
        },
      })
      synced++

      const msgsRes = await fetch(
        `${apiBase}/${conv.id}/messages?fields=id,message,from,created_time,attachments,shares&limit=20&access_token=${encodeURIComponent(token)}`
      )
      const msgsBody = (await msgsRes.json()) as {
        data?: Array<{
          id: string
          message?: string
          from: { username: string; id: string }
          created_time: string
          attachments?: { data: Array<{ type: string; url?: string }> }
          shares?: { data: Array<{ link: string; name?: string }> }
        }>
        error?: { message?: string }
      }

      if (msgsBody.data) {
        for (const msg of msgsBody.data) {
          const direction = msg.from.id === config.ig_account_id ? "outbound" : "inbound"
          const rawText = msg.message?.trim()
          const shareLink = msg.shares?.data?.[0]?.link
          const attachmentType = msg.attachments?.data?.[0]?.type
          const attachmentUrl = msg.attachments?.data?.[0]?.url
          let messageText: string
          if (rawText) {
            messageText = rawText
          } else if (shareLink) {
            messageText = `[Shared post: ${shareLink}]`
          } else if (attachmentType) {
            messageText = `[${attachmentType}${attachmentUrl ? `: ${attachmentUrl}` : ""}]`
          } else {
            messageText = "[Unsupported message type]"
          }

          try {
            await prisma.instagram_messages.upsert({
              where: { ig_message_id: msg.id },
              create: {
                conversation_id: conversation.id,
                ig_message_id: msg.id,
                direction,
                message_text: messageText,
                timestamp: new Date(msg.created_time),
              },
              update: {},
            })
            messagesImported++
          } catch {
            // Skip duplicates
          }
        }

        const latestMsg = msgsBody.data[0]
        if (latestMsg) {
          const latestShare = latestMsg.shares?.data?.[0]?.link
          const latestText = latestMsg.message?.trim() || (latestShare ? "Shared a post" : latestMsg.attachments?.data?.[0]?.type || "Media")
          await prisma.instagram_conversations.update({
            where: { id: conversation.id },
            data: {
              last_message_preview: latestText.slice(0, 100),
              last_message_at: new Date(latestMsg.created_time),
            },
          })
        }
      }
    }

    return NextResponse.json({ synced, messagesImported })
  } catch (err) {
    console.error("[instagram] Sync error:", err)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
