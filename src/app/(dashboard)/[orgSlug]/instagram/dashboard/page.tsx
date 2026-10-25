"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
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
  Loader2,
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
    fetch(`/api/orgs/${orgSlug}/instagram/dashboard`)
      .then((r) => r.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => setData({ connected: false, automations_count: 0, active_automations: 0, conversations_count: 0, unread_count: 0, contacts_count: 0, recent_triggers: 0, dms_sent: 0, emails_captured: 0 }))
      .finally(() => setLoading(false))
  }, [orgSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
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
    { label: "DMs Sent", value: data.dms_sent, icon: Send, color: "text-blue-400", bg: "bg-blue-500/10", href: "/instagram/inbox" },
    { label: "Automations", value: `${data.active_automations}/${data.automations_count}`, icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", href: "/instagram/automations", sub: "active" },
    { label: "Emails Captured", value: data.emails_captured, icon: Mail, color: "text-emerald-400", bg: "bg-emerald-500/10", href: "/instagram/contacts" },
    { label: "Total Triggers", value: data.recent_triggers, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10", href: "/instagram/analytics", sub: "last 7 days" },
  ]

  const quickLinks = [
    { label: "DM Inbox", desc: data.unread_count > 0 ? `${data.unread_count} unread` : "All caught up", icon: MessageCircle, href: "/instagram/inbox", badge: data.unread_count > 0 ? data.unread_count : null },
    { label: "Automations", desc: `${data.active_automations} active`, icon: Zap, href: "/instagram/automations" },
    { label: "Contacts", desc: `${data.contacts_count} captured`, icon: Users, href: "/instagram/contacts" },
    { label: "Analytics", desc: "View performance", icon: BarChart3, href: "/instagram/analytics" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-sm text-zinc-400">
            Connected as <span className="text-zinc-200 font-medium">@{data.ig_username}</span>
          </span>
        </div>
      </div>

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
