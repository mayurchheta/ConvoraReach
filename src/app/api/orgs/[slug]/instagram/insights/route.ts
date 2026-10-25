import { NextRequest, NextResponse } from "next/server"
import { verifyOrgAccess } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

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

  const period = req.nextUrl.searchParams.get("period") ?? "30d"
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30

  const now = new Date()
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const sinceUnix = Math.floor(since.getTime() / 1000)
  const untilUnix = Math.floor(now.getTime() / 1000)

  const apiBase = config.api_base || "https://graph.instagram.com/v21.0"
  const token = config.page_access_token

  let accountInsights: Array<{ name: string; values: Array<{ value: number; end_time: string }> }> = []
  try {
    const metrics = "reach,accounts_engaged,profile_views"
    const url = `${apiBase}/${config.ig_account_id}/insights?metric=${metrics}&period=day&since=${sinceUnix}&until=${untilUnix}&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const body = (await res.json()) as {
      data?: Array<{ name: string; values: Array<{ value: number; end_time: string }> }>
      error?: { message?: string }
    }
    if (body.data) {
      accountInsights = body.data
    }
  } catch (err) {
    console.error("[instagram] Account insights error:", err)
  }

  let followerCount = 0
  try {
    const url = `${apiBase}/${config.ig_account_id}?fields=followers_count&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    const body = (await res.json()) as { followers_count?: number }
    if (body.followers_count !== undefined) {
      followerCount = body.followers_count
    }
  } catch (err) {
    console.error("[instagram] Follower count error:", err)
  }

  let mediaInsights: Array<{
    id: string; caption: string; media_type: string; timestamp: string; permalink: string
    reach: number; impressions: number; likes: number; comments: number
  }> = []

  try {
    const mediaUrl = `${apiBase}/${config.ig_account_id}/media?fields=id,caption,media_type,timestamp,permalink&limit=10&access_token=${encodeURIComponent(token)}`
    const mediaRes = await fetch(mediaUrl)
    const mediaBody = (await mediaRes.json()) as {
      data?: Array<{ id: string; caption?: string; media_type: string; timestamp: string; permalink: string }>
    }

    if (mediaBody.data) {
      const results = await Promise.allSettled(
        mediaBody.data.map(async (media) => {
          const insUrl = `${apiBase}/${media.id}/insights?metric=reach,impressions,likes,comments&access_token=${encodeURIComponent(token)}`
          const insRes = await fetch(insUrl)
          const insBody = (await insRes.json()) as {
            data?: Array<{ name: string; values: Array<{ value: number }> }>
          }
          const metrics: Record<string, number> = {}
          if (insBody.data) {
            for (const m of insBody.data) {
              metrics[m.name] = m.values?.[0]?.value ?? 0
            }
          }
          return {
            id: media.id,
            caption: media.caption ?? "",
            media_type: media.media_type,
            timestamp: media.timestamp,
            permalink: media.permalink,
            reach: metrics.reach ?? 0,
            impressions: metrics.impressions ?? 0,
            likes: metrics.likes ?? 0,
            comments: metrics.comments ?? 0,
          }
        })
      )
      mediaInsights = results
        .filter((r): r is PromiseFulfilledResult<typeof mediaInsights[number]> => r.status === "fulfilled")
        .map((r) => r.value)
        .sort((a, b) => b.reach - a.reach)
    }
  } catch (err) {
    console.error("[instagram] Media insights error:", err)
  }

  const totals: Record<string, number> = { reach: 0, accounts_engaged: 0, profile_views: 0 }
  const daily: Array<{ date: string; reach: number; accounts_engaged: number; profile_views: number }> = []

  for (const metric of accountInsights) {
    for (const v of metric.values) {
      totals[metric.name] = (totals[metric.name] ?? 0) + v.value
    }
  }

  const reachMetric = accountInsights.find((m) => m.name === "reach")
  const engagedMetric = accountInsights.find((m) => m.name === "accounts_engaged")
  const profileViewsMetric = accountInsights.find((m) => m.name === "profile_views")

  if (reachMetric) {
    for (let i = 0; i < reachMetric.values.length; i++) {
      daily.push({
        date: reachMetric.values[i].end_time.split("T")[0],
        reach: reachMetric.values[i].value,
        accounts_engaged: engagedMetric?.values[i]?.value ?? 0,
        profile_views: profileViewsMetric?.values[i]?.value ?? 0,
      })
    }
  }

  return NextResponse.json({
    totals,
    follower_count: followerCount,
    daily,
    top_posts: mediaInsights,
  })
}
