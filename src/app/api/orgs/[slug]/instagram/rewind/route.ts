import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAdmin } from "@/lib/auth"
import {
  getOrgInstagramConfig,
  getRecentMedia,
  getMediaComments,
  sendInstagramDM,
  checkFollowerStatus,
} from "@/lib/instagram"
import { canSendDM, recordDMSent, waitForSlot } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "No Instagram integration configured" }, { status: 400 })
  }

  try {
    const media = await getRecentMedia(config.ig_account_id, config.page_access_token, 25, config.api_base)
    return NextResponse.json({ media })
  } catch (err) {
    console.error("[rewind] getRecentMedia failed:", err)
    return NextResponse.json({ error: "Failed to fetch recent media" }, { status: 502 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const body = await req.json() as { media_id?: string; automation_id?: string }
  if (!body.media_id?.trim()) {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 })
  }
  if (!body.automation_id?.trim()) {
    return NextResponse.json({ error: "automation_id is required" }, { status: 400 })
  }

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "No Instagram integration configured" }, { status: 400 })
  }

  const automation = await prisma.instagram_automations.findFirst({
    where: { id: body.automation_id, org_id: access.org.id, is_active: true },
  })
  if (!automation) {
    return NextResponse.json({ error: "Automation not found or inactive" }, { status: 404 })
  }

  const MAX_REWIND_DMS = 50
  const mediaId = body.media_id.trim()
  const token = config.page_access_token
  const igAccountId = config.ig_account_id
  const keywords = automation.keywords as string[]

  let dmsSent = 0
  let alreadyProcessed = 0
  let capped = false
  let after: string | undefined = undefined

  do {
    let page: Awaited<ReturnType<typeof getMediaComments>>
    try {
      page = await getMediaComments(mediaId, token, after, config.api_base)
    } catch (err) {
      console.error("[rewind] getMediaComments failed:", err)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 502 })
    }

    for (const comment of page.data) {
      if (dmsSent >= MAX_REWIND_DMS) { capped = true; break }
      if (!comment.from?.id) continue

      if (automation.trigger_type === "comment_keyword") {
        const text = comment.text.toLowerCase()
        const matched = keywords.some((kw) => text.includes(kw.toLowerCase()))
        if (!matched) continue
      }

      const igUserId = comment.from.id
      const commentId = comment.id

      // Opt-out check
      const optedOut = await prisma.instagram_optouts.findUnique({
        where: { org_id_ig_user_id: { org_id: access.org.id, ig_user_id: igUserId } },
      })
      if (optedOut) { alreadyProcessed++; continue }

      const existingLog = await prisma.instagram_automation_logs.findFirst({
        where: { org_id: access.org.id, ig_user_id: igUserId, comment_id: commentId },
      })
      if (existingLog) { alreadyProcessed++; continue }

      if (automation.follow_gate) {
        const isFollower = await checkFollowerStatus(igAccountId, igUserId, token, config.api_base)
        if (!isFollower) continue
      }

      // Rate limiting — wait for a slot
      const rateCheck = canSendDM(access.org.id)
      if (!rateCheck.allowed) {
        await waitForSlot(access.org.id)
      }

      let dmSent = false
      try {
        await sendInstagramDM(igUserId, automation.dm_message, igAccountId, token, config.api_base)
        recordDMSent(access.org.id)
        dmSent = true
        dmsSent++
      } catch (err) {
        console.error(`[rewind] sendInstagramDM failed for user ${igUserId}:`, err)
      }

      await prisma.instagram_automation_logs.create({
        data: {
          org_id: access.org.id,
          automation_id: automation.id,
          ig_user_id: igUserId,
          trigger_type: automation.trigger_type,
          media_id: mediaId,
          comment_id: commentId,
          dm_sent: dmSent,
          comment_replied: false,
        },
      })

      await prisma.instagram_contacts.upsert({
        where: { org_id_ig_user_id: { org_id: access.org.id, ig_user_id: igUserId } },
        update: { username: comment.from.username ?? null, updated_at: new Date() },
        create: {
          org_id: access.org.id,
          ig_user_id: igUserId,
          username: comment.from.username ?? null,
          source: "rewind",
          automation_id: automation.id,
        },
      })

      // Rate limiter handles spacing (12s between DMs)
    }

    after = !capped && page.paging?.next ? page.paging.cursors.after : undefined
  } while (after)

  if (capped) {
    return NextResponse.json({
      queued: dmsSent, skipped: alreadyProcessed, capped: true,
      message: "Reached limit of 50 DMs per request",
    })
  }

  return NextResponse.json({ queued: dmsSent, skipped: alreadyProcessed })
}
