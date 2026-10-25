import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess, verifyOrgAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

type TriggerType =
  | "comment_keyword"
  | "story_reply"
  | "dm_keyword"
  | "all_comments"
  | "all_story_replies"
  | "all_dms"

const KEYWORD_TRIGGER_TYPES: TriggerType[] = ["comment_keyword", "dm_keyword"]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const automations = await prisma.instagram_automations.findMany({
    where: { org_id: access.org.id },
    orderBy: { created_at: "desc" },
  })

  return NextResponse.json({ automations })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const body = await req.json() as {
    name?: string
    trigger_type?: TriggerType
    keywords?: string[]
    comment_reply?: string
    dm_message?: string
    follow_gate?: boolean
    collect_email?: boolean
    email_prompt?: string
    link_url?: string
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  if (!body.dm_message?.trim()) {
    return NextResponse.json({ error: "dm_message is required" }, { status: 400 })
  }
  const triggerType = (body.trigger_type ?? "comment_keyword") as TriggerType
  if (KEYWORD_TRIGGER_TYPES.includes(triggerType)) {
    if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
      return NextResponse.json(
        { error: `keywords must be a non-empty array for trigger_type "${triggerType}"` },
        { status: 400 }
      )
    }
  }
  if (body.collect_email && !body.email_prompt?.trim()) {
    return NextResponse.json({ error: "email_prompt is required when collect_email is true" }, { status: 400 })
  }

  const automation = await prisma.instagram_automations.create({
    data: {
      org_id: access.org.id,
      name: body.name.trim(),
      trigger_type: triggerType,
      keywords: body.keywords ?? [],
      comment_reply: body.comment_reply ?? null,
      dm_message: body.dm_message.trim(),
      follow_gate: body.follow_gate ?? false,
      collect_email: body.collect_email ?? false,
      email_prompt: body.email_prompt ?? null,
      link_url: body.link_url ?? null,
    },
  })

  return NextResponse.json({ automation }, { status: 201 })
}
