import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { prisma } from "@/lib/prisma"
import {
  sendInstagramDM,
  replyToComment,
  checkFollowerStatus,
  getInstagramProfile,
} from "@/lib/instagram"
import { canSendDM, recordDMSent } from "@/lib/rate-limiter"

export const dynamic = "force-dynamic"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OPTOUT_KEYWORDS = ["stop", "unsubscribe", "opt out", "opt-out", "cancel", "remove me"]

// ─── GET: Webhook Verification ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode")
  const token = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN?.trim()

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[webhook] Verification successful")
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } })
  }

  console.warn("[webhook] Verification failed", { mode, tokenMatch: token === verifyToken })
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// ─── POST: Process Webhook Events ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify HMAC signature — single app secret, no guessing
  const signature = req.headers.get("x-hub-signature-256")
  if (!verifySignature(rawBody, signature)) {
    console.error("[webhook] HMAC signature mismatch")
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
  }

  let payload: WebhookPayload
  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    console.error("[webhook] Invalid JSON body")
    return NextResponse.json({ status: "ok" }, { status: 200 })
  }

  console.log("[webhook] Received:", payload.object, "entries:", payload.entry?.length)

  const results: string[] = []

  if (payload.object === "instagram" && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      try {
        // Comment events
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "comments" || change.field === "feed") {
              await processComment(entry.id, change.value)
              results.push("comment_processed")
            }
            if (change.field === "mentions") {
              await processStoryMention(entry.id, change.value)
              results.push("story_mention_processed")
            }
          }
        }

        // DM events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message && event.sender?.id) {
              await processMessage(entry.id, event)
              results.push("message_processed")
            }
          }
        }
      } catch (err) {
        console.error("[webhook] Entry processing error:", err)
        results.push("entry_error")
      }
    }
  }

  // Always return 200 to prevent Meta from backing off
  return NextResponse.json({ status: "ok", results })
}

// ─── Signature Verification ────────────────────────────────────────────────────

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.error("[webhook] No X-Hub-Signature-256 header")
    return false
  }

  // Try META_APP_SECRET first (Facebook App Secret), then INSTAGRAM_APP_SECRET
  const secrets = [
    process.env.META_APP_SECRET?.trim(),
    process.env.INSTAGRAM_APP_SECRET?.trim(),
  ].filter(Boolean) as string[]

  if (secrets.length === 0) {
    console.error("[webhook] No app secrets configured")
    return false
  }

  for (const secret of secrets) {
    const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex")
    if (signature === expected) {
      return true
    }
  }

  console.error("[webhook] HMAC mismatch — signature:", signature?.slice(0, 20) + "...", "tried", secrets.length, "secrets")
  return false
}

// ─── Find Org by IG Account ID ─────────────────────────────────────────────────

async function findOrgByIgAccountId(igAccountId: string) {
  const integration = await prisma.org_integrations.findFirst({
    where: {
      platform: "instagram",
      is_active: true,
      config: { path: ["ig_account_id"], equals: igAccountId },
    },
    include: { org: true },
  })
  if (!integration) return null

  const config = integration.config as Record<string, unknown>
  return {
    org: integration.org,
    config: {
      ig_account_id: config.ig_account_id as string,
      access_token: config.access_token as string,
      api_base: (config.api_base as string) ?? "https://graph.instagram.com/v21.0",
    },
  }
}

// ─── Opt-Out Check ─────────────────────────────────────────────────────────────

async function isOptedOut(orgId: string, igUserId: string): Promise<boolean> {
  const optout = await prisma.instagram_optouts.findUnique({
    where: { org_id_ig_user_id: { org_id: orgId, ig_user_id: igUserId } },
  })
  return !!optout
}

// ─── Rate-Limited DM Send ──────────────────────────────────────────────────────

async function rateLimitedSendDM(
  orgId: string,
  igUserId: string,
  message: string,
  igAccountId: string,
  accessToken: string,
  apiBase: string
): Promise<boolean> {
  const rateCheck = canSendDM(orgId)
  if (!rateCheck.allowed) {
    console.warn(`[webhook] Rate limited for org ${orgId}: ${rateCheck.reason}`)
    return false
  }
  await sendInstagramDM(igUserId, message, igAccountId, accessToken, apiBase)
  recordDMSent(orgId)
  return true
}

// ─── Process Comment ───────────────────────────────────────────────────────────

async function processComment(igAccountId: string, value: Record<string, unknown>) {
  const commentId = value.id as string
  const text = (value.text as string) ?? ""
  const fromId = (value.from as Record<string, string>)?.id
  const mediaId = (value.media as Record<string, string>)?.id

  if (!commentId || !fromId) return

  // Skip own comments
  if (fromId === igAccountId) return

  const orgData = await findOrgByIgAccountId(igAccountId)
  if (!orgData) {
    console.warn("[webhook] No org found for IG account:", igAccountId)
    return
  }

  const { org, config } = orgData

  // Opt-out check
  if (await isOptedOut(org.id, fromId)) return

  // Idempotency: skip if already processed
  const existing = await prisma.instagram_automation_logs.findFirst({
    where: { org_id: org.id, comment_id: commentId },
  })
  if (existing) return

  // Find matching automations
  const automations = await prisma.instagram_automations.findMany({
    where: {
      org_id: org.id,
      is_active: true,
      trigger_type: { in: ["comment_keyword", "all_comments"] },
    },
  })

  for (const automation of automations) {
    if (!matchesKeywords(automation, text)) continue

    await runAutomationAction({
      org,
      config,
      automation,
      igUserId: fromId,
      commentId,
      mediaId,
      source: "comment_automation",
    })
    break // First match wins
  }
}

// ─── Process DM Message ────────────────────────────────────────────────────────

async function processMessage(
  igAccountId: string,
  event: { sender: { id: string }; message: { mid: string; text?: string }; timestamp?: number }
) {
  const senderId = event.sender.id
  const messageText = event.message.text ?? ""
  const messageId = event.message.mid
  const timestamp = event.timestamp ? new Date(event.timestamp * 1000) : new Date()

  // Skip echo messages (from ourselves)
  if (senderId === igAccountId) return

  const orgData = await findOrgByIgAccountId(igAccountId)
  if (!orgData) return

  const { org, config } = orgData

  // Upsert conversation
  const conversation = await prisma.instagram_conversations.upsert({
    where: { org_id_ig_user_id: { org_id: org.id, ig_user_id: senderId } },
    create: {
      org_id: org.id,
      ig_user_id: senderId,
      last_message_at: timestamp,
      last_message_preview: messageText.slice(0, 200),
      unread_count: 1,
    },
    update: {
      last_message_at: timestamp,
      last_message_preview: messageText.slice(0, 200),
      unread_count: { increment: 1 },
    },
  })

  // Try to fetch profile if we don't have username
  if (!conversation.username) {
    const profile = await getInstagramProfile(senderId, config.access_token, config.api_base)
    if (profile) {
      await prisma.instagram_conversations.update({
        where: { id: conversation.id },
        data: { username: profile.username, profile_pic_url: profile.profile_picture_url },
      })
    }
  }

  // Store message (skip duplicates)
  try {
    await prisma.instagram_messages.create({
      data: {
        conversation_id: conversation.id,
        ig_message_id: messageId,
        direction: "inbound",
        message_text: messageText,
        timestamp,
      },
    })
  } catch {
    // Duplicate ig_message_id — already stored
    return
  }

  // ─── Opt-Out Detection ─────────────────────────────────────────────────────
  if (OPTOUT_KEYWORDS.some((kw) => messageText.toLowerCase().trim() === kw)) {
    await prisma.instagram_optouts.upsert({
      where: { org_id_ig_user_id: { org_id: org.id, ig_user_id: senderId } },
      create: { org_id: org.id, ig_user_id: senderId, reason: "stop" },
      update: { reason: "stop" },
    })
    try {
      await rateLimitedSendDM(
        org.id, senderId,
        "You've been unsubscribed. You won't receive automated messages from us anymore.",
        config.ig_account_id, config.access_token, config.api_base
      )
    } catch {}
    return
  }

  // ─── Opt-Out Check ─────────────────────────────────────────────────────────
  if (await isOptedOut(org.id, senderId)) return

  // ─── Email Capture State Machine ───────────────────────────────────────────
  if (conversation.pending_automation_id) {
    if (EMAIL_REGEX.test(messageText.trim())) {
      // Capture email
      await prisma.instagram_contacts.upsert({
        where: { org_id_ig_user_id: { org_id: org.id, ig_user_id: senderId } },
        create: {
          org_id: org.id,
          ig_user_id: senderId,
          username: conversation.username,
          email: messageText.trim(),
          source: "dm_automation",
          automation_id: conversation.pending_automation_id,
        },
        update: { email: messageText.trim() },
      })

      // Load automation for thank-you message
      const automation = await prisma.instagram_automations.findUnique({
        where: { id: conversation.pending_automation_id },
      })
      const thankYou = automation?.link_url
        ? `Thanks! Here's your link: ${automation.link_url}`
        : "Thanks! Your email has been saved."

      try {
        await sendInstagramDM(senderId, thankYou, config.ig_account_id, config.access_token, config.api_base)
      } catch (err) {
        console.error("[webhook] Failed to send thank-you DM:", err)
      }

      // Log email capture
      if (automation) {
        await prisma.instagram_automation_logs.create({
          data: {
            org_id: org.id,
            automation_id: automation.id,
            ig_user_id: senderId,
            trigger_type: automation.trigger_type,
            dm_sent: true,
            email_captured: messageText.trim(),
          },
        }).catch(() => {})
      }

      // Clear pending state
      await prisma.instagram_conversations.update({
        where: { id: conversation.id },
        data: { pending_automation_id: null },
      })
      return
    } else {
      // Not an email — re-prompt once then clear
      try {
        await sendInstagramDM(
          senderId,
          "Please reply with your email address to continue:",
          config.ig_account_id,
          config.access_token,
          config.api_base
        )
      } catch {}
      await prisma.instagram_conversations.update({
        where: { id: conversation.id },
        data: { pending_automation_id: null },
      })
      return
    }
  }

  // ─── DM Keyword Matching ───────────────────────────────────────────────────
  const automations = await prisma.instagram_automations.findMany({
    where: {
      org_id: org.id,
      is_active: true,
      trigger_type: { in: ["dm_keyword", "all_dms"] },
    },
  })

  for (const automation of automations) {
    if (!matchesKeywords(automation, messageText)) continue

    await runAutomationAction({
      org,
      config,
      automation,
      igUserId: senderId,
      source: "dm_automation",
    })
    break
  }
}

// ─── Process Story Mention ─────────────────────────────────────────────────────

async function processStoryMention(igAccountId: string, value: Record<string, unknown>) {
  const senderId = (value.sender as Record<string, string>)?.id
  const mediaId = value.media_id as string

  if (!senderId) return

  const orgData = await findOrgByIgAccountId(igAccountId)
  if (!orgData) return

  const { org, config } = orgData

  const automations = await prisma.instagram_automations.findMany({
    where: {
      org_id: org.id,
      is_active: true,
      trigger_type: { in: ["story_reply", "all_story_replies"] },
    },
  })

  for (const automation of automations) {
    await runAutomationAction({
      org,
      config,
      automation,
      igUserId: senderId,
      mediaId,
      source: "story_reply",
    })
    break
  }
}

// ─── Keyword Matching ──────────────────────────────────────────────────────────

function matchesKeywords(
  automation: { trigger_type: string; keywords: string[] },
  text: string
): boolean {
  // "all_*" triggers match everything
  if (automation.trigger_type.startsWith("all_")) return true

  if (!automation.keywords.length) return false
  const lower = text.toLowerCase()
  return automation.keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

// ─── Run Automation Action ─────────────────────────────────────────────────────

async function runAutomationAction(opts: {
  org: { id: string }
  config: { ig_account_id: string; access_token: string; api_base: string }
  automation: {
    id: string
    trigger_type: string
    dm_message: string
    comment_reply: string | null
    follow_gate: boolean
    collect_email: boolean
    email_prompt: string | null
    link_url: string | null
  }
  igUserId: string
  commentId?: string
  mediaId?: string
  source: string
}) {
  const { org, config, automation, igUserId, commentId, mediaId, source } = opts

  // Opt-out check
  if (await isOptedOut(org.id, igUserId)) return

  // Follow gate check
  if (automation.follow_gate) {
    const isFollower = await checkFollowerStatus(
      config.ig_account_id,
      igUserId,
      config.access_token,
      config.api_base
    )
    if (!isFollower) {
      try {
        await rateLimitedSendDM(org.id, igUserId, "Follow us first to get the link!", config.ig_account_id, config.access_token, config.api_base)
      } catch {}
      return
    }
  }

  // Email capture flow
  if (automation.collect_email) {
    const prompt = automation.email_prompt ?? "Drop your email to get the link:"
    try {
      await rateLimitedSendDM(org.id, igUserId, prompt, config.ig_account_id, config.access_token, config.api_base)
    } catch (err) {
      console.error("[webhook] Failed to send email prompt:", err)
    }

    await prisma.instagram_conversations.upsert({
      where: { org_id_ig_user_id: { org_id: org.id, ig_user_id: igUserId } },
      create: {
        org_id: org.id,
        ig_user_id: igUserId,
        pending_automation_id: automation.id,
      },
      update: { pending_automation_id: automation.id },
    })
  } else {
    // Direct DM (rate-limited)
    try {
      await rateLimitedSendDM(org.id, igUserId, automation.dm_message, config.ig_account_id, config.access_token, config.api_base)
    } catch (err) {
      console.error("[webhook] Failed to send DM:", err)
    }
  }

  // Comment reply
  if (automation.comment_reply && commentId) {
    try {
      await replyToComment(commentId, automation.comment_reply, config.access_token, config.api_base)
    } catch (err) {
      console.error("[webhook] Failed to reply to comment:", err)
    }
  }

  // Upsert contact
  await prisma.instagram_contacts.upsert({
    where: { org_id_ig_user_id: { org_id: org.id, ig_user_id: igUserId } },
    create: {
      org_id: org.id,
      ig_user_id: igUserId,
      source,
      automation_id: automation.id,
    },
    update: { source, automation_id: automation.id },
  })

  // Create automation log
  await prisma.instagram_automation_logs.create({
    data: {
      org_id: org.id,
      automation_id: automation.id,
      ig_user_id: igUserId,
      trigger_type: automation.trigger_type,
      media_id: mediaId,
      comment_id: commentId,
      dm_sent: true,
      comment_replied: !!automation.comment_reply && !!commentId,
    },
  }).catch(() => {})
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  object: string
  entry?: Array<{
    id: string
    time?: number
    changes?: Array<{ field: string; value: Record<string, unknown> }>
    messaging?: Array<{
      sender: { id: string }
      recipient: { id: string }
      message: { mid: string; text?: string }
      timestamp?: number
    }>
  }>
}
