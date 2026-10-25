"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Send, MessageCircle } from "lucide-react"
import { useInstagramStatus } from "@/lib/use-instagram-status"
import { ConnectInstagramPrompt } from "@/components/connect-prompt"

interface Conversation {
  id: string
  ig_user_id: string
  username: string | null
  profile_pic_url: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  is_archived: boolean
}

interface Message {
  id: string
  direction: string // "inbound" | "outbound"
  message_text: string | null
  timestamp: string
}

type FilterTab = "all" | "unread" | "archived"

function formatRelativeTime(ts: string | null): string {
  if (!ts) return ""
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString()
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function AvatarCircle({
  username,
  profilePicUrl,
  size = "md",
}: {
  username: string | null
  profilePicUrl: string | null
  size?: "sm" | "md"
}) {
  const [imgError, setImgError] = useState(false)
  const initial = (username ?? "?")[0].toUpperCase()
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"

  if (profilePicUrl && !imgError) {
    return (
      <img
        src={profilePicUrl}
        alt={username ?? ""}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initial}
    </div>
  )
}

export default function InstagramInboxPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const igConnected = useInstagramStatus(orgSlug)

  // Left panel state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [convCursor, setConvCursor] = useState<string | null>(null)
  const [hasMoreConvs, setHasMoreConvs] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")

  // Right panel state
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [msgCursor, setMsgCursor] = useState<string | null>(null)
  const [sendText, setSendText] = useState("")
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchConversations = useCallback(
    async (opts: { reset?: boolean; searchVal?: string; filterVal?: FilterTab } = {}) => {
      const { reset = false, searchVal = search, filterVal = filter } = opts
      if (reset) {
        setLoadingConvs(true)
        setConvCursor(null)
      } else {
        setLoadingMore(true)
      }

      try {
        const params = new URLSearchParams()
        if (searchVal) params.set("search", searchVal)
        if (filterVal !== "all") params.set("filter", filterVal)
        if (!reset && convCursor) params.set("cursor", convCursor)

        const res = await fetch(
          `/api/orgs/${orgSlug}/instagram/conversations?${params}`
        )
        if (!res.ok) throw new Error("Failed to load conversations")
        const data = (await res.json()) as {
          conversations: Conversation[]
          nextCursor: string | null
        }

        setConversations((prev) =>
          reset ? data.conversations : [...prev, ...data.conversations]
        )
        setConvCursor(data.nextCursor)
        setHasMoreConvs(!!data.nextCursor)
      } catch {
        toast.error("Failed to load conversations")
      } finally {
        setLoadingConvs(false)
        setLoadingMore(false)
      }
    },
    [orgSlug, search, filter, convCursor]
  )

  // Initial load
  useEffect(() => {
    fetchConversations({ reset: true, searchVal: search, filterVal: filter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, filter])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchConversations({ reset: true, searchVal: search, filterVal: filter })
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Infinite scroll
  const handleLeftScroll = useCallback(() => {
    const el = leftPanelRef.current
    if (!el || loadingMore || !hasMoreConvs) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      fetchConversations({ reset: false })
    }
  }, [fetchConversations, loadingMore, hasMoreConvs])

  useEffect(() => {
    const el = leftPanelRef.current
    if (!el) return
    el.addEventListener("scroll", handleLeftScroll)
    return () => el.removeEventListener("scroll", handleLeftScroll)
  }, [handleLeftScroll])

  // Load messages when conversation selected
  const loadMessages = useCallback(
    async (conv: Conversation, cursorVal?: string) => {
      setLoadingMsgs(true)
      try {
        const params = new URLSearchParams()
        if (cursorVal) params.set("cursor", cursorVal)
        const res = await fetch(
          `/api/orgs/${orgSlug}/instagram/conversations/${conv.id}?${params}`
        )
        if (!res.ok) throw new Error("Failed to load messages")
        const data = (await res.json()) as {
          conversation: Conversation
          messages: Message[]
          nextCursor: string | null
        }
        setMessages(data.messages)
        setMsgCursor(data.nextCursor)
      } catch {
        toast.error("Failed to load messages")
      } finally {
        setLoadingMsgs(false)
      }
    },
    [orgSlug]
  )

  const handleSelectConv = useCallback(
    async (conv: Conversation) => {
      setSelectedConv(conv)
      setMessages([])
      setSendText("")
      await loadMessages(conv)

      // Mark as read
      if (conv.unread_count > 0) {
        fetch(`/api/orgs/${orgSlug}/instagram/conversations/${conv.id}`, {
          method: "POST",
        }).catch(() => {})
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
        )
      }
    },
    [loadMessages, orgSlug]
  )

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!selectedConv || !sendText.trim() || sending) return
    const text = sendText.trim()
    setSending(true)
    setSendText("")
    try {
      const res = await fetch(
        `/api/orgs/${orgSlug}/instagram/conversations/${selectedConv.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      )
      if (!res.ok) throw new Error("Failed to send message")
      const data = (await res.json()) as { message: Message }
      setMessages((prev) => [...prev, data.message])
    } catch {
      toast.error("Failed to send message")
      setSendText(text)
    } finally {
      setSending(false)
    }
  }, [selectedConv, sendText, sending, orgSlug])

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "archived", label: "Archived" },
  ]

  if (igConnected === false) {
    return <div className="p-6"><ConnectInstagramPrompt feature="DM Inbox" /></div>
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="border-r flex flex-col overflow-hidden bg-background">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b px-3 gap-1 py-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-purple-100 text-purple-800"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div ref={leftPanelRef} className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 border-b border-muted/30 ${
                    selectedConv?.id === conv.id ? "bg-accent" : ""
                  }`}
                >
                  <AvatarCircle
                    username={conv.username}
                    profilePicUrl={conv.profile_pic_url}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">
                        {conv.username ?? conv.ig_user_id}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message_preview ?? "No messages yet"}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center shrink-0">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {loadingMore && (
                <div className="flex justify-center py-3">
                  <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col overflow-hidden bg-muted/30">
        {!selectedConv ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-14 w-14 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">
              Choose a conversation from the left to view messages
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-background">
              <AvatarCircle
                username={selectedConv.username}
                profilePicUrl={selectedConv.profile_pic_url}
                size="sm"
              />
              <div>
                <p className="font-medium text-sm">
                  {selectedConv.username ?? selectedConv.ig_user_id}
                </p>
                <p className="text-xs text-muted-foreground">Instagram DM</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground text-sm">
                  No messages yet
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isOutbound = msg.direction === "outbound"
                    const showTime =
                      idx === 0 ||
                      Math.abs(
                        new Date(msg.timestamp).getTime() -
                          new Date(messages[idx - 1].timestamp).getTime()
                      ) > 5 * 60 * 1000

                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div className="flex justify-center my-2">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                              isOutbound
                                ? "bg-indigo-600 text-white rounded-br-sm"
                                : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                            }`}
                          >
                            {(() => {
                              const text = msg.message_text?.trim()
                              if (!text) return <span className="italic opacity-60">Unsupported message type</span>
                              // Shared post link
                              const shareMatch = text.match(/^\[Shared post: (https:\/\/www\.instagram\.com\/\S+)\]$/)
                              if (shareMatch) {
                                return (
                                  <span className="space-y-1">
                                    <span className="block text-xs opacity-70">Shared a post</span>
                                    <a href={shareMatch[1]} target="_blank" rel="noreferrer" className="text-xs underline opacity-80 hover:opacity-100 break-all">
                                      {shareMatch[1]}
                                    </a>
                                  </span>
                                )
                              }
                              // Other unsupported types
                              if (text.startsWith("[") && text.endsWith("]")) {
                                return <span className="italic opacity-60">{text.slice(1, -1)}</span>
                              }
                              return text
                            })()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t bg-background px-4 py-3 flex items-center gap-2">
              <Input
                className="flex-1 h-10 text-sm"
                placeholder="Type a message..."
                value={sendText}
                onChange={(e) => setSendText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={sending}
              />
              <Button
                size="sm"
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSend}
                disabled={!sendText.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
