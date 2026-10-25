import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

type TriggerType =
  | "comment_keyword"
  | "story_reply"
  | "dm_keyword"
  | "all_comments"
  | "all_story_replies"
  | "all_dms"

const KEYWORD_TRIGGER_TYPES: TriggerType[] = ["comment_keyword", "dm_keyword"]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const existing = await prisma.instagram_automations.findFirst({
    where: { id, org_id: access.org.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 })
  }

  const body = await req.json() as {
    name?: string
    trigger_type?: TriggerType
    keywords?: string[]
    comment_reply?: string | null
    dm_message?: string
    follow_gate?: boolean
    collect_email?: boolean
    email_prompt?: string | null
    link_url?: string | null
    is_active?: boolean
  }

  if (body.name !== undefined && !body.name.trim()) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 })
  }
  if (body.dm_message !== undefined && !body.dm_message.trim()) {
    return NextResponse.json({ error: "dm_message cannot be empty" }, { status: 400 })
  }

  const effectiveTriggerType = (body.trigger_type ?? existing.trigger_type) as TriggerType
  const effectiveKeywords = body.keywords ?? existing.keywords
  if (KEYWORD_TRIGGER_TYPES.includes(effectiveTriggerType)) {
    if (!Array.isArray(effectiveKeywords) || effectiveKeywords.length === 0) {
      return NextResponse.json(
        { error: `keywords must be a non-empty array for trigger_type "${effectiveTriggerType}"` },
        { status: 400 }
      )
    }
  }

  const effectiveCollectEmail = body.collect_email ?? existing.collect_email
  const effectiveEmailPrompt = body.email_prompt ?? existing.email_prompt
  if (effectiveCollectEmail && !effectiveEmailPrompt?.trim()) {
    return NextResponse.json({ error: "email_prompt is required when collect_email is true" }, { status: 400 })
  }

  const automation = await prisma.instagram_automations.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.trigger_type !== undefined && { trigger_type: body.trigger_type }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.comment_reply !== undefined && { comment_reply: body.comment_reply }),
      ...(body.dm_message !== undefined && { dm_message: body.dm_message.trim() }),
      ...(body.follow_gate !== undefined && { follow_gate: body.follow_gate }),
      ...(body.collect_email !== undefined && { collect_email: body.collect_email }),
      ...(body.email_prompt !== undefined && { email_prompt: body.email_prompt }),
      ...(body.link_url !== undefined && { link_url: body.link_url }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
    },
  })

  return NextResponse.json({ automation })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const existing = await prisma.instagram_automations.findFirst({
    where: { id, org_id: access.org.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 })
  }

  await prisma.instagram_automations.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
