import { NextRequest, NextResponse } from "next/server"
import { verifyOrgAccess } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

// GET: Fetch full Instagram profile info
// Requires: instagram_business_basic + profile_management permissions
export async function GET(
  _req: NextRequest,
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
    const url = `${apiBase}/me?fields=user_id,username,name,profile_picture_url,account_type,media_count,followers_count,follows_count,biography,website&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const body = (await res.json()) as {
      user_id?: string
      username?: string
      name?: string
      profile_picture_url?: string
      account_type?: string
      media_count?: number
      followers_count?: number
      follows_count?: number
      biography?: string
      website?: string
      error?: { message?: string }
    }

    if (!res.ok || body.error) {
      return NextResponse.json(
        { error: body.error?.message ?? "Failed to fetch profile" },
        { status: 502 }
      )
    }

    return NextResponse.json({ profile: body })
  } catch (err) {
    console.error("[instagram] Profile fetch error:", err)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
