"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInstagramStatus } from "@/lib/use-instagram-status"
import { ConnectInstagramPrompt } from "@/components/connect-prompt"
import { AtSign, ExternalLink, RefreshCw, Loader2 } from "lucide-react"

interface TaggedPost {
  id: string
  caption?: string
  media_type: string
  timestamp: string
  permalink: string
  media_url?: string
}

export default function MentionsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const igConnected = useInstagramStatus(orgSlug)
  const [posts, setPosts] = useState<TaggedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/tagged-content`)
      const data = (await res.json()) as { tagged_posts?: TaggedPost[]; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to load tagged content")
        setPosts([])
      } else {
        setPosts(data.tagged_posts ?? [])
      }
    } catch {
      setError("Failed to load tagged content")
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    load()
  }, [load])

  if (igConnected === false) {
    return <div className="p-6"><ConnectInstagramPrompt feature="Mentions" /></div>
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mentions &amp; Tagged Posts</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Posts where other Instagram users have tagged your account. Monitor brand
            mentions and respond to turn them into engagement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : error ? (
        <Card className="p-6 border-zinc-800">
          <p className="text-sm text-zinc-400">{error}</p>
          <p className="text-xs text-zinc-600 mt-2">
            Tagged content requires the <code>instagram_business_tagged_content</code>{" "}
            permission. Once approved by Meta, posts that tag your account will appear here.
          </p>
        </Card>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
            <AtSign className="h-7 w-7 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No tagged posts yet</h2>
          <p className="text-sm text-zinc-500 max-w-sm">
            When other users tag your account in their posts, they&apos;ll show up here so
            you can monitor and respond to brand mentions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden bg-zinc-900/50 border-zinc-800">
              {post.media_url && post.media_type !== "VIDEO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.media_url}
                  alt={post.caption ?? "Tagged post"}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-zinc-800 flex items-center justify-center">
                  <AtSign className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              <div className="p-4">
                <p className="text-sm text-zinc-300 line-clamp-2">
                  {post.caption || "(no caption)"}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-zinc-600">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
