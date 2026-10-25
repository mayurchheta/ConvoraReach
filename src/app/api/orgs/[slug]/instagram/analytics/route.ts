import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
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

  const [totalLogs, dmsSentLogs, repliedLogs, emailLogs] = await prisma.$transaction([
    prisma.instagram_automation_logs.count({ where: baseWhere }),
    prisma.instagram_automation_logs.count({ where: { ...baseWhere, dm_sent: true } }),
    prisma.instagram_automation_logs.count({ where: { ...baseWhere, comment_replied: true } }),
    prisma.instagram_automation_logs.count({ where: { ...baseWhere, email_captured: { not: null } } }),
  ])

  const autoFilter: Prisma.Sql = automationIdFilter
    ? Prisma.sql`AND automation_id = ${automationIdFilter}::uuid`
    : Prisma.empty

  const autoFilterJoined: Prisma.Sql = automationIdFilter
    ? Prisma.sql`AND l.automation_id = ${automationIdFilter}::uuid`
    : Prisma.empty

  const dailyRaw = await prisma.$queryRaw<
    Array<{ date: string; triggers: bigint; dms: bigint; emails: bigint }>
  >(Prisma.sql`
    SELECT
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      COUNT(*) AS triggers,
      COUNT(*) FILTER (WHERE dm_sent = true) AS dms,
      COUNT(*) FILTER (WHERE email_captured IS NOT NULL) AS emails
    FROM instagram_automation_logs
    WHERE org_id = ${orgId}::uuid
      AND created_at >= ${since}
      ${autoFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  const daily = dailyRaw.map((row) => ({
    date: row.date,
    triggers: Number(row.triggers),
    dms: Number(row.dms),
    emails: Number(row.emails),
  }))

  const byAutomationRaw = await prisma.$queryRaw<
    Array<{ automation_id: string; name: string; trigger_type: string; triggers: bigint; dms: bigint; emails: bigint }>
  >(Prisma.sql`
    SELECT
      l.automation_id::text,
      a.name,
      a.trigger_type,
      COUNT(*) AS triggers,
      COUNT(*) FILTER (WHERE l.dm_sent = true) AS dms,
      COUNT(*) FILTER (WHERE l.email_captured IS NOT NULL) AS emails
    FROM instagram_automation_logs l
    JOIN instagram_automations a ON a.id = l.automation_id
    WHERE l.org_id = ${orgId}::uuid
      AND l.created_at >= ${since}
      ${autoFilterJoined}
    GROUP BY l.automation_id, a.name, a.trigger_type
    ORDER BY triggers DESC
  `)

  const by_automation = byAutomationRaw.map((row) => ({
    automation_id: row.automation_id,
    name: row.name,
    trigger_type: row.trigger_type,
    triggers: Number(row.triggers),
    dms: Number(row.dms),
    emails: Number(row.emails),
  }))

  const byTriggerRaw = await prisma.$queryRaw<
    Array<{ trigger_type: string; count: bigint }>
  >(Prisma.sql`
    SELECT trigger_type, COUNT(*) AS count
    FROM instagram_automation_logs
    WHERE org_id = ${orgId}::uuid
      AND created_at >= ${since}
      ${autoFilter}
    GROUP BY trigger_type
    ORDER BY count DESC
  `)

  const by_trigger_type = byTriggerRaw.map((row) => ({
    trigger_type: row.trigger_type,
    count: Number(row.count),
  }))

  return NextResponse.json({
    total_triggers: totalLogs,
    dms_sent: dmsSentLogs,
    comments_replied: repliedLogs,
    emails_captured: emailLogs,
    daily,
    by_automation,
    by_trigger_type,
  })
}
