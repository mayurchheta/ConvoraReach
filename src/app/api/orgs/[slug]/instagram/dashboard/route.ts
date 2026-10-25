import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const orgId = access.org.id

  // Check connection
  const config = await getOrgInstagramConfig(orgId)

  if (!config) {
    return NextResponse.json({ connected: false })
  }

  // Fetch all stats in one batch
  const since7d = new Date()
  since7d.setDate(since7d.getDate() - 7)

  const [
    automations,
    conversationsCount,
    unreadCount,
    contactsCount,
    triggerStats,
  ] = await Promise.all([
    prisma.instagram_automations.findMany({
      where: { org_id: orgId },
      select: { is_active: true },
    }),
    prisma.instagram_conversations.count({ where: { org_id: orgId } }),
    prisma.instagram_conversations.count({ where: { org_id: orgId, unread_count: { gt: 0 } } }),
    prisma.instagram_contacts.count({ where: { org_id: orgId } }),
    prisma.$transaction([
      prisma.instagram_automation_logs.count({ where: { org_id: orgId, created_at: { gte: since7d } } }),
      prisma.instagram_automation_logs.count({ where: { org_id: orgId, created_at: { gte: since7d }, dm_sent: true } }),
      prisma.instagram_automation_logs.count({ where: { org_id: orgId, created_at: { gte: since7d }, email_captured: { not: null } } }),
    ]),
  ])

  return NextResponse.json({
    connected: true,
    ig_username: config.ig_username,
    automations_count: automations.length,
    active_automations: automations.filter((a) => a.is_active).length,
    conversations_count: conversationsCount,
    unread_count: unreadCount,
    contacts_count: contactsCount,
    recent_triggers: triggerStats[0],
    dms_sent: triggerStats[1],
    emails_captured: triggerStats[2],
  })
}
