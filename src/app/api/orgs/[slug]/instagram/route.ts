import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess, verifyOrgAdmin } from "@/lib/auth"
import { getOrgInstagramConfig, subscribeInstagramWebhooks } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    ig_account_id: config.ig_account_id,
    ig_username: config.ig_username,
    connection_type: config.connection_type,
  })
}

export async function POST(
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

  const ok = await subscribeInstagramWebhooks(config.page_id, config.page_access_token, config.api_base)
  if (!ok) {
    return NextResponse.json({ error: "Failed to subscribe webhooks" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE: Disconnect Instagram — clean all data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const orgId = access.org.id

  // Delete all Instagram data for this org (order matters — foreign keys)
  // 1. Get conversation IDs for this org
  const convIds = (await prisma.instagram_conversations.findMany({
    where: { org_id: orgId },
    select: { id: true },
  })).map(c => c.id)

  // 2. Delete in FK order
  if (convIds.length > 0) {
    await prisma.instagram_messages.deleteMany({ where: { conversation_id: { in: convIds } } })
  }
  await prisma.instagram_automation_logs.deleteMany({ where: { org_id: orgId } })
  await prisma.instagram_automations.deleteMany({ where: { org_id: orgId } })
  await prisma.instagram_conversations.deleteMany({ where: { org_id: orgId } })
  await prisma.instagram_contacts.deleteMany({ where: { org_id: orgId } })
  await prisma.instagram_optouts.deleteMany({ where: { org_id: orgId } })

  // Delete the integration record entirely (not just deactivate)
  await prisma.org_integrations.deleteMany({
    where: { org_id: orgId, platform: "instagram" },
  })

  return NextResponse.json({ ok: true })
}
