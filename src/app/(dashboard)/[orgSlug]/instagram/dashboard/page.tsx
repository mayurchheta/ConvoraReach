"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectInstagramPrompt } from "@/components/connect-prompt"
import {
  MessageCircle,
  Zap,
  Users,
  BarChart3,
  Send,
  Mail,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface DashboardData {
  connected: boolean
  ig_username?: string
  automations_count: number
  active_automations: number
  conversations_count: number
  unread_count: number
  contacts_count: number
  recent_triggers: number
  dms_sent: number
  emails_captured: number
}

export default function DashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [orgSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDashboard() {
    try {
      // Fetch connection status + stats in parallel
      const [statusRes, automationsRes, convsRes, contactsRes, analyticsRes] = await Promise.allSettled([
        fetch(`/api/orgs/${orgSlug}/instagram`),
        fetch(`/api/orgs/${orgSlug}/instagram/automations`),
        fetch(`/api/orgs/${orgSlug}/instagram/conversations?limit=1`),
        fetch(`/api/orgs/${orgSlug}/instagram/analytics?period=30d`),
        fetch(`/api/orgs/${orgSlug}/instagram/analytics?period=7d`),
      ])

      const status = statusRes.status === "fulfilled" && statusRes.value.ok
        ? await statusRes.value.json() as { connected: boolean; ig_username?: string }
        : { connected: false }

      const automations = automationsRes.status === "fulfilled" && automationsRes.value.ok
        ? await automationsRes.value.json() as { automations: Array<{ is_active: boolean }> }
        : { automations: [] }

      const analytics = analyticsRes.status === "fulfilled" && analyticsRes.value.ok
        ? await analyticsRes.value.json() as { total_triggers: number; dms_sent: number; emails_captured: number }
        : { total_triggers: 0, dms_sent: 0, emails_captured: 0 }

      // Get unread count from conversations
      let unread = 0
      let convsCount = 0
      let contactsCount = 0
      if (convsRes.status === "fulfilled" && convsRes.value.ok) {
        // Fetch unread separately
        try {
          const unreadRes = await fetch(`/api/orgs/${orgSlug}/instagram/conversations?filter=unread`)
          if (unreadRes.ok) {
            const d = await unreadRes.json() as { conversations: unknown[] }
            unread = d.conversations.length
          }
        } catch {}
        // Count total
        try {
          const allRes = await fetch(`/api/orgs/${orgSlug}/instagram/conversations`)
          if (allRes.ok) {
            const d = await allRes.json() as { conversations: unknown[] }
            convsCount = d.conversations.length
          }
        } catch {}
      }

      // Contacts count via analytics emails_captured (approximation)
      if (contactsRes.status === "fulfilled" && contactsRes.value.ok) {
        const d = await contactsRes.value.json() as { total_triggers: number; emails_captured: number }
        contactsCount = d.emails_captured
      }

      setData({
        connected: status.connected,
        ig_username: status.ig_username,
        automations_count: automations.automations.length,
        active_automations: automations.automations.filter(a => a.is_active).length,
        conversations_count: convsCount,
        unread_count: unread,
        contacts_count: contactsCount,
        recent_triggers: analytics.total_triggers,
        dms_sent: analytics.dms_sent,
        emails_captured: analytics.emails_captured,
      })
    } catch {
      setData({ connected: false, automations_count: 0, active_automations: 0, conversations_count: 0, unread_count: 0, contacts_count: 0, recent_triggers: 0, dms_sent: 0, emails_captured: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-800 animate-pulse rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data?.connected) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <ConnectInstagramPrompt feature="Dashboard" />
      </div>
    )
  }

  const stats = [
    { label: "DMs Sent", value: data.dms_sent, icon: Send, color: "text-blue-400", bg: "bg-blue-500/10", href: `/${orgSlug}/instagram/inbox` },
    { label: "Automations", value: `${data.active_automations}/${data.automations_count}`, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", href: `/${orgSlug}/instagram/automations`, sub: "active" },
    { label: "Emails Captured", value: data.emails_captured, icon: Mail, color: "text-emerald-400", bg: "bg-emerald-500/10", href: `/${orgSlug}/instagram/contacts` },
    { label: "Total Triggers", value: data.recent_triggers, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10", href: `/${orgSlug}/instagram/analytics`, sub: "last 7 days" },
  ]

  const quickLinks = [
    { label: "DM Inbox", desc: data.unread_count > 0 ? `${data.unread_count} unread` : "All caught up", icon: MessageCircle, href: `/${orgSlug}/instagram/inbox`, badge: data.unread_count > 0 ? data.unread_count : null },
    { label: "Automations", desc: `${data.active_automations} active`, icon: Zap, href: `/${orgSlug}/instagram/automations` },
    { label: "Contacts", desc: `${data.contacts_count} captured`, icon: Users, href: `/${orgSlug}/instagram/contacts` },
    { label: "Analytics", desc: "View performance", icon: BarChart3, href: `/${orgSlug}/instagram/analytics` },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm text-zinc-400">
              Connected as <span className="text-zinc-200 font-medium">@{data.ig_username}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.sub && <p className="text-xs text-zinc-600 mt-0.5">{stat.sub}</p>}
                </div>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              <Card className="p-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <link.icon className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-zinc-500">{link.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.badge && (
                      <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px]">
                        {link.badge}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
