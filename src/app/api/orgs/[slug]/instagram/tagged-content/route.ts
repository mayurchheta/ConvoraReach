import { NextRequest, NextResponse } from "next/server"
import { verifyOrgAccess } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

// GET: Fetch posts where the account is tagged
// Requires: instagram_tagged_content permission
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "Instagram not connected" }, { status: 400 })
  }

  const apiBase = config.api_base || "https://graph.instagram.com/v21.0"
  const token = config.page_access_token

  try {
    const url = `${apiBase}/${config.ig_account_id}/tags?fields=id,caption,media_type,timestamp,permalink,media_url&limit=20&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const body = (await res.json()) as {
      data?: Array<{
        id: string
        caption?: string
        media_type: string
        timestamp: string
        permalink: string
        media_url?: string
      }>
      error?: { message?: string }
    }

    if (!res.ok || body.error) {
      return NextResponse.json(
        { error: body.error?.message ?? "Failed to fetch tagged content" },
        { status: 502 }
      )
    }

    return NextResponse.json({ tagged_posts: body.data ?? [] })
  } catch (err) {
    console.error("[instagram] Tagged content error:", err)
    return NextResponse.json({ error: "Failed to fetch tagged content" }, { status: 500 })
  }
}
