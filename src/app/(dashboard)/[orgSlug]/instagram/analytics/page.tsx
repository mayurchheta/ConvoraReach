"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Mail,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Eye,
  Users,
  UserCheck,
  Heart,
} from "lucide-react"

type Period = "7d" | "30d" | "90d"

interface DailyPoint {
  date: string
  triggers: number
  dms: number
  emails: number
}

interface AutomationStat {
  automation_id: string
  name: string
  trigger_type: string
  triggers: number
  dms: number
  emails: number
}

interface TriggerTypeStat {
  trigger_type: string
  count: number
}

interface AnalyticsData {
  total_triggers: number
  dms_sent: number
  comments_replied: number
  emails_captured: number
  daily: DailyPoint[]
  by_automation: AutomationStat[]
  by_trigger_type: TriggerTypeStat[]
}

interface InsightsData {
  totals: { reach: number; accounts_engaged: number; profile_views: number }
  follower_count: number
  daily: Array<{ date: string; reach: number; accounts_engaged: number; profile_views: number }>
  top_posts: Array<{
    id: string; caption: string; media_type: string; timestamp: string
    permalink: string; reach: number; engaged: number; likes: number; comments: number
  }>
}

const TRIGGER_LABELS: Record<string, string> = {
  comment_keyword: "Comment Keyword",
  story_reply: "Story Reply",
  dm_keyword: "DM Keyword",
  all_comments: "All Comments",
  all_story_replies: "All Story Replies",
  all_dms: "All DMs",
}

const TRIGGER_COLORS: Record<string, string> = {
  comment_keyword: "bg-purple-500",
  story_reply: "bg-blue-500",
  dm_keyword: "bg-green-500",
  all_comments: "bg-pink-500",
  all_story_replies: "bg-indigo-500",
  all_dms: "bg-teal-500",
}

type SortKey = "name" | "dms" | "emails" | "triggers"
type SortDir = "asc" | "desc"

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
  if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

export default function InstagramAnalyticsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [period, setPeriod] = useState<Period>("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("dms")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [insights, setInsights] = useState<InsightsData | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        fetch(`/api/orgs/${orgSlug}/instagram/analytics?period=${period}`),
        fetch(`/api/orgs/${orgSlug}/instagram/insights?period=${period}`),
      ])
      if (analyticsRes.ok) {
        setData((await analyticsRes.json()) as AnalyticsData)
      }
      if (insightsRes.ok) {
        setInsights((await insightsRes.json()) as InsightsData)
      }
    } finally {
      setLoading(false)
    }
  }, [orgSlug, period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sortedAutomations = data
    ? [...data.by_automation].sort((a, b) => {
        const aVal = a[sortKey as keyof AutomationStat] as number | string
        const bVal = b[sortKey as keyof AutomationStat] as number | string
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        return sortDir === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      })
    : []

  // Bar chart calculations
  const maxDms = data ? Math.max(...data.daily.map(d => d.dms), 1) : 1
  const maxEmails = data ? Math.max(...data.daily.map(d => d.emails), 1) : 1
  const chartMax = Math.max(maxDms, maxEmails, 1)

  const totalTriggerTypes = data
    ? data.by_trigger_type.reduce((s, t) => s + t.count, 0)
    : 0

  if (loading) {
    return (
      <div className="p-6 max-w-5xl space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const stats = [
    {
      label: "DMs Sent",
      value: data?.dms_sent ?? 0,
      icon: MessageCircle,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600",
    },
    {
      label: "Emails Captured",
      value: data?.emails_captured ?? 0,
      icon: Mail,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600",
    },
    {
      label: "Comments Replied",
      value: data?.comments_replied ?? 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600",
    },
    {
      label: "Total Triggers",
      value: data?.total_triggers ?? 0,
      icon: Zap,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-orange-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Instagram Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Automation performance and engagement metrics
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Daily Activity Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Daily Activity</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>DMs Sent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>Emails Captured</span>
            </div>
          </div>
        </div>

        {data && data.daily.length > 0 ? (
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {data.daily.map(point => (
              <div
                key={point.date}
                className="flex flex-col items-center gap-0.5 flex-1 min-w-[24px]"
                title={`${point.date}: ${point.dms} DMs, ${point.emails} emails`}
              >
                <div className="flex items-end gap-0.5 w-full">
                  {/* DMs bar */}
                  <div
                    className="flex-1 bg-blue-500 rounded-t-sm transition-all min-h-[2px]"
                    style={{
                      height: `${Math.max(
                        2,
                        Math.round((point.dms / chartMax) * 120)
                      )}px`,
                    }}
                  />
                  {/* Emails bar */}
                  <div
                    className="flex-1 bg-green-500 rounded-t-sm transition-all min-h-[2px]"
                    style={{
                      height: `${Math.max(
                        2,
                        Math.round((point.emails / chartMax) * 120)
                      )}px`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                  {new Date(point.date).toLocaleDateString("en", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            No activity data for this period
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Per-Automation Breakdown */}
        <Card className="md:col-span-2 p-6">
          <h2 className="font-medium mb-4">By Automation</h2>
          {sortedAutomations.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {(
                      [
                        { key: "name" as SortKey, label: "Automation" },
                        { key: "triggers" as SortKey, label: "Triggers" },
                        { key: "dms" as SortKey, label: "DMs" },
                        { key: "emails" as SortKey, label: "Emails" },
                      ] as const
                    ).map(col => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedAutomations.map(a => (
                    <tr key={a.automation_id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="font-medium truncate max-w-[160px]">
                          {a.name}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-0.5"
                        >
                          {TRIGGER_LABELS[a.trigger_type] ?? a.trigger_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {a.triggers}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-blue-600">
                        {a.dms}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-green-600">
                        {a.emails}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No automation data yet
            </p>
          )}
        </Card>

        {/* By Trigger Type */}
        <Card className="p-6">
          <h2 className="font-medium mb-4">By Trigger Type</h2>
          {data && data.by_trigger_type.length > 0 ? (
            <div className="space-y-3">
              {data.by_trigger_type.map(t => {
                const pct =
                  totalTriggerTypes > 0
                    ? Math.round((t.count / totalTriggerTypes) * 100)
                    : 0
                const color =
                  TRIGGER_COLORS[t.trigger_type] ?? "bg-muted-foreground"
                return (
                  <div key={t.trigger_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground truncate">
                        {TRIGGER_LABELS[t.trigger_type] ?? t.trigger_type}
                      </span>
                      <span className="text-xs font-medium">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </Card>
      </div>

      {/* ── Instagram Insights (native IG metrics) ─────────────────────────── */}
      {insights && (
        <>
          <h2 className="font-medium text-lg pt-2">Instagram Insights</h2>

          {/* IG Insights Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reach</p>
                  <p className="text-3xl font-bold mt-1 text-indigo-600">{insights.totals.reach.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                  <Eye className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engaged</p>
                  <p className="text-3xl font-bold mt-1 text-cyan-600">{insights.totals.accounts_engaged?.toLocaleString() ?? "0"}</p>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30">
                  <BarChart3 className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-3xl font-bold mt-1 text-pink-600">{insights.totals.profile_views.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/30">
                  <UserCheck className="h-4 w-4 text-pink-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{insights.follower_count.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Reach & Engaged Chart */}
          {insights.daily.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">Reach & Engaged</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                    <span>Reach</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-cyan-400" />
                    <span>Engaged</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                {(() => {
                  const maxVal = Math.max(...insights.daily.map(d => Math.max(d.reach, d.accounts_engaged)), 1)
                  return insights.daily.map(point => (
                    <div
                      key={point.date}
                      className="flex flex-col items-center gap-0.5 flex-1 min-w-[24px]"
                      title={`${point.date}: ${point.reach} reach, ${point.accounts_engaged} engaged`}
                    >
                      <div className="flex items-end gap-0.5 w-full">
                        <div
                          className="flex-1 bg-indigo-500 rounded-t-sm min-h-[2px]"
                          style={{ height: `${Math.max(2, Math.round((point.reach / maxVal) * 120))}px` }}
                        />
                        <div
                          className="flex-1 bg-cyan-400 rounded-t-sm min-h-[2px]"
                          style={{ height: `${Math.max(2, Math.round((point.accounts_engaged / maxVal) * 120))}px` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                        {new Date(point.date).toLocaleDateString("en", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </Card>
          )}

          {/* Top Posts */}
          {insights.top_posts.length > 0 && (
            <Card className="p-6">
              <h2 className="font-medium mb-4">Top Posts by Reach</h2>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Post</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Reach</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Engaged</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Likes</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {insights.top_posts.map(post => (
                      <tr key={post.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5">
                          <a href={post.permalink} target="_blank" rel="noreferrer" className="hover:underline">
                            <div className="font-medium truncate max-w-[200px]">{post.caption || "(no caption)"}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">{post.media_type}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(post.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </a>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-indigo-600">{post.reach.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{post.engaged.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-400" />
                            {post.likes.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{post.comments.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}