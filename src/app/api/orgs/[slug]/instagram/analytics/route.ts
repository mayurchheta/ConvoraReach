import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess } from "@/lib/auth"

export const dynamic = "force-dynamic"

type Period = "7d" | "30d" | "90d"

function periodToDays(period: Period): number {
  switch (period) {
    case "7d": return 7
    case "30d": return 30
    case "90d": return 90
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const { searchParams } = new URL(req.url)
  const rawPeriod = searchParams.get("period") ?? "30d"
  const period: Period = ["7d", "30d", "90d"].includes(rawPeriod)
    ? (rawPeriod as Period)
    : "30d"
  const automationIdFilter = searchParams.get("automation_id") ?? undefined

  const days = periodToDays(period)
  const since = new Date()
  since.setDate(since.getDate() - days)

  const orgId = access.org.id

  const baseWhere = {
    org_id: orgId,
    created_at: { gte: since },
    ...(automationIdFilter ? { automation_id: automationIdFilter } : {}),
  }

  try {
    // Aggregate totals using Prisma queries (no raw SQL)
    const [totalLogs, dmsSentLogs, repliedLogs, emailLogs] = await Promise.all([
      prisma.instagram_automation_logs.count({ where: baseWhere }),
      prisma.instagram_automation_logs.count({ where: { ...baseWhere, dm_sent: true } }),
      prisma.instagram_automation_logs.count({ where: { ...baseWhere, comment_replied: true } }),
      prisma.instagram_automation_logs.count({ where: { ...baseWhere, email_captured: { not: null } } }),
    ])

    // Daily breakdown — fetch all logs and group in JS
    const allLogs = await prisma.instagram_automation_logs.findMany({
      where: baseWhere,
      select: {
        created_at: true,
        dm_sent: true,
        email_captured: true,
        automation_id: true,
        trigger_type: true,
      },
      orderBy: { created_at: "asc" },
    })

    // Group by date
    const dailyMap = new Map<string, { triggers: number; dms: number; emails: number }>()
    for (const log of allLogs) {
      const date = log.created_at.toISOString().split("T")[0]
      const entry = dailyMap.get(date) ?? { triggers: 0, dms: 0, emails: 0 }
      entry.triggers++
      if (log.dm_sent) entry.dms++
      if (log.email_captured) entry.emails++
      dailyMap.set(date, entry)
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Per-automation breakdown
    const automationMap = new Map<string, { triggers: number; dms: number; emails: number }>()
    for (const log of allLogs) {
      const entry = automationMap.get(log.automation_id) ?? { triggers: 0, dms: 0, emails: 0 }
      entry.triggers++
      if (log.dm_sent) entry.dms++
      if (log.email_captured) entry.emails++
      automationMap.set(log.automation_id, entry)
    }

    // Fetch automation names
    const automationIds = Array.from(automationMap.keys())
    const automations = automationIds.length > 0
      ? await prisma.instagram_automations.findMany({
          where: { id: { in: automationIds } },
          select: { id: true, name: true, trigger_type: true },
        })
      : []

    const automationLookup = new Map(automations.map(a => [a.id, a]))
    const by_automation = Array.from(automationMap.entries())
      .map(([id, stats]) => {
        const auto = automationLookup.get(id)
        return {
          automation_id: id,
          name: auto?.name ?? "Unknown",
          trigger_type: auto?.trigger_type ?? "unknown",
          ...stats,
        }
      })
      .sort((a, b) => b.triggers - a.triggers)

    // By trigger type
    const triggerMap = new Map<string, number>()
    for (const log of allLogs) {
      triggerMap.set(log.trigger_type, (triggerMap.get(log.trigger_type) ?? 0) + 1)
    }
    const by_trigger_type = Array.from(triggerMap.entries())
      .map(([trigger_type, count]) => ({ trigger_type, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      total_triggers: totalLogs,
      dms_sent: dmsSentLogs,
      comments_replied: repliedLogs,
      emails_captured: emailLogs,
      daily,
      by_automation,
      by_trigger_type,
    })
  } catch (err) {
    console.error("[analytics] Error:", err)
    return NextResponse.json({
      total_triggers: 0,
      dms_sent: 0,
      comments_replied: 0,
      emails_captured: 0,
      daily: [],
      by_automation: [],
      by_trigger_type: [],
    })
  }
}
