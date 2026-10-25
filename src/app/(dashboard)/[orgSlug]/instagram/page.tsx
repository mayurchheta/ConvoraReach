"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Bot,
  MessageCircle,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Bell,
  RotateCcw,
  Image,
  Video,
  ChevronDown,
  PenSquare,
} from "lucide-react"

interface InstagramStatus {
  connected: boolean
  ig_account_id?: string
  ig_username?: string
  connection_type?: "instagram_login" | "facebook_login"
}

interface RewindMedia {
  id: string
  caption: string | null
  media_type: string
  timestamp: string
  permalink: string
}

interface Automation {
  id: string
  name: string
  trigger_type: string
  is_active: boolean
}

export default function InstagramSettingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [status, setStatus] = useState<InstagramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const instagramAppId = "1265737819063214"
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/auth/instagram/callback`
    : "https://reach.convora.io/api/auth/instagram/callback"
  const igOAuthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights&state=${orgSlug}`

  // Rewind state
  const [rewindMedia, setRewindMedia] = useState<RewindMedia[]>([])
  const [rewindLoading, setRewindLoading] = useState(false)
  const [automations, setAutomations] = useState<Automation[]>([])
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [selectedAutomation, setSelectedAutomation] = useState<string>("")
  const [rewinding, setRewinding] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/instagram`)
      .then((r) => r.json())
      .then((data: InstagramStatus) => {
        setStatus(data)
        setLoading(false)
        if (data.connected) {
          // Fetch rewind media + automations in parallel
          setRewindLoading(true)
          Promise.all([
            fetch(`/api/orgs/${orgSlug}/instagram/rewind`).then(r => r.json()),
            fetch(`/api/orgs/${orgSlug}/instagram/automations`).then(r => r.json()),
          ])
            .then(([rewindData, autoData]) => {
              setRewindMedia((rewindData as { media: RewindMedia[] }).media ?? [])
              setAutomations(
                ((autoData as { automations: Automation[] }).automations ?? []).filter(
                  a => a.is_active
                )
              )
            })
            .catch(() => {})
            .finally(() => setRewindLoading(false))
        }
      })
      .catch(() => setLoading(false))
  }, [orgSlug])

  async function handleRewind(mediaId: string) {
    if (!selectedAutomation) {
      toast.error("Please select an automation first")
      return
    }
    setRewinding(mediaId)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/rewind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: mediaId, automation_id: selectedAutomation }),
      })
      const json = (await res.json()) as { queued?: number; skipped?: number; error?: string }
      if (!res.ok) throw new Error(json.error ?? "Rewind failed")
      toast.success(
        `Sent ${json.queued ?? 0} DMs, skipped ${json.skipped ?? 0} already contacted`
      )
      setSelectedPost(null)
      setSelectedAutomation("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rewind failed")
    } finally {
      setRewinding(null)
    }
  }

  async function handleSyncDMs() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/sync`, { method: "POST" })
      const json = (await res.json()) as { synced?: number; messagesImported?: number; error?: string }
      if (!res.ok) throw new Error(json.error ?? "Sync failed")
      toast.success(`Synced ${json.synced ?? 0} conversations, ${json.messagesImported ?? 0} messages`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Instagram? Your automations and DM history will be preserved.")) return
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram`, { method: "DELETE" })
      if (res.ok) {
        setStatus({ connected: false })
        toast.success("Instagram disconnected")
      } else {
        toast.error("Failed to disconnect")
      }
    } catch {
      toast.error("Failed to disconnect")
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSubscribeWebhooks() {
    setSubscribing(true)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram`, {
        method: "POST",
      })
      const json = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error ?? "Failed to subscribe webhooks")
      toast.success("Webhooks subscribed successfully")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to subscribe webhooks"
      )
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-semibold">Instagram</h1>
      </div>

      {/* Connection Card */}
      <Card className="p-6 space-y-4">
        <h2 className="font-medium text-lg">Connection Status</h2>

        {!status?.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Instagram Professional account to start automating comments and DMs.
            </p>

            {/* Option 1: Instagram Direct Login */}
            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/30 dark:to-background p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Connect with Instagram</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Sign in directly with your Instagram account — no Facebook Page needed.
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 shrink-0 ml-2">Recommended</Badge>
              </div>
              <ul className="space-y-1.5">
                {["No Facebook Page required", "Sign in with Instagram credentials", "Works with any Professional account"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <a
                href={igOAuthUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Camera className="h-4 w-4" />
                Connect with Instagram
              </a>
            </div>

            {/* Option 2: Facebook Login — Coming Soon */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 opacity-60">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Connect via Facebook</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Connect through your Facebook Page for additional features.
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 ml-2">Coming Soon</Badge>
              </div>
              <ul className="space-y-1.5">
                {["Facebook Page integration", "Extended API capabilities", "Page-level analytics"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Button variant="outline" disabled className="cursor-not-allowed">
                Coming Soon
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  <span className="text-sm font-medium">
                    @{status.ig_username ?? status.ig_account_id}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    via {status.connection_type === "instagram_login" ? "Instagram" : "Facebook"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncDMs}
                  disabled={syncing}
                  className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {syncing ? "Syncing..." : "Sync DMs"}
                </button>
                <a
                  href={igOAuthUrl}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  Reconnect
                </a>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {disconnecting ? "..." : "Disconnect"}
                </button>
              </div>
            </div>

            {status.connection_type === "instagram_login" ? (
              <div className="pt-2 border-t flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Real-time events active — comments and messages are processed automatically</span>
              </div>
            ) : (
              <div className="pt-2 border-t space-y-2">
                <p className="text-sm text-muted-foreground">
                  Subscribe to receive real-time comment and DM events from Instagram.
                  Run this once after connecting or if automations stop working.
                </p>
                <Button
                  onClick={handleSubscribeWebhooks}
                  disabled={subscribing}
                  variant="outline"
                  size="sm"
                >
                  {subscribing ? "Subscribing…" : "Subscribe Webhooks"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation Cards (only when connected) */}
      {status?.connected && (
        <>
          <h2 className="font-medium text-lg">Features</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/instagram/automations">
              <Card className="p-5 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-md group-hover:bg-purple-200 transition-colors">
                    <Bot className="h-4 w-4 text-purple-700" />
                  </div>
                  <span className="font-medium text-sm">Automations</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-reply to comments & DMs with keyword triggers
                </p>
              </Card>
            </Link>

            <Link href="/instagram/inbox">
              <Card className="p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                    <MessageCircle className="h-4 w-4 text-blue-700" />
                  </div>
                  <span className="font-medium text-sm">DM Inbox</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  View and manage Instagram DM conversations
                </p>
              </Card>
            </Link>

            <Link href="/instagram/contacts">
              <Card className="p-5 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer group space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-md group-hover:bg-green-200 transition-colors">
                    <Users className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="font-medium text-sm">Contacts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instagram followers who interacted with automations
                </p>
              </Card>
            </Link>

            <Link href="/instagram/analytics">
              <Card className="p-5 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer group space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
                    <BarChart3 className="h-4 w-4 text-orange-700" />
                  </div>
                  <span className="font-medium text-sm">Analytics</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automation performance and engagement metrics
                </p>
              </Card>
            </Link>

            <Link href="/instagram/publish">
              <Card className="p-5 hover:border-pink-300 hover:shadow-sm transition-all cursor-pointer group space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 rounded-md group-hover:bg-rose-200 transition-colors">
                    <PenSquare className="h-4 w-4 text-rose-700" />
                  </div>
                  <span className="font-medium text-sm">Publish</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Publish photo posts directly to your Instagram account
                </p>
              </Card>
            </Link>
          </div>

          {/* Rewind Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <RotateCcw className="h-4 w-4 text-indigo-700" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-lg">Rewind</h2>
                <p className="text-sm text-muted-foreground">
                  Retroactively send DMs to people who already commented on a past post.
                </p>
              </div>
            </div>

            {rewindLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : rewindMedia.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent posts found. Make sure your Instagram account has posts.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {rewindMedia.map(post => {
                  const isSelected = selectedPost === post.id
                  return (
                    <div
                      key={post.id}
                      className={`rounded-lg border p-3 space-y-2 transition-colors ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {/* Post header */}
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          {post.media_type === "VIDEO" ? (
                            <Video className="h-2.5 w-2.5" />
                          ) : (
                            <Image className="h-2.5 w-2.5" />
                          )}
                          {post.media_type === "VIDEO" ? "Reel" : "Post"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.timestamp).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Caption */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.caption ?? "(no caption)"}
                      </p>

                      {/* Rewind button / inline panel */}
                      {!isSelected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-7"
                          onClick={() => {
                            setSelectedPost(post.id)
                            setSelectedAutomation("")
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rewind
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-[10px] text-amber-800 dark:text-amber-300">
                            This will DM everyone who commented a matching keyword on this post.
                          </div>

                          {/* Automation selector */}
                          <div className="relative">
                            <select
                              value={selectedAutomation}
                              onChange={e => setSelectedAutomation(e.target.value)}
                              className="w-full text-xs border border-border rounded-md px-2 py-1.5 pr-6 bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="">Select automation…</option>
                              {automations.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                          </div>

                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="flex-1 text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                              disabled={!selectedAutomation || rewinding === post.id}
                              onClick={() => handleRewind(post.id)}
                            >
                              {rewinding === post.id ? "Sending…" : "Confirm"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => {
                                setSelectedPost(null)
                                setSelectedAutomation("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}