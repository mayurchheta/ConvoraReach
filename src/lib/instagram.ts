import { prisma } from "@/lib/prisma"

const GRAPH_API = "https://graph.facebook.com/v21.0"
const IG_GRAPH_API = "https://graph.instagram.com/v21.0"

// ─── Reply to a comment ───────────────────────────────────────────────────────

export async function replyToComment(
  commentId: string,
  message: string,
  accessToken: string,
  apiBase?: string
): Promise<{ id: string }> {
  const base = apiBase ?? GRAPH_API
  const res = await fetch(`${base}/${commentId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  })
  const body = await res.json() as Record<string, unknown>
  if (!res.ok || (body as { error?: unknown }).error) {
    const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
    console.error(`[instagram] replyToComment: ${errMsg}`)
    throw new Error(`[instagram] replyToComment: ${errMsg}`)
  }
  return body as { id: string }
}

// ─── Send Instagram DM ────────────────────────────────────────────────────────

export async function sendInstagramDM(
  igUserId: string,
  message: string,
  igAccountId: string,
  accessToken: string,
  apiBase?: string
): Promise<{ recipient_id: string; message_id: string }> {
  const base = apiBase ?? GRAPH_API
  const res = await fetch(`${base}/${igAccountId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: igUserId },
      message: { text: message },
    }),
  })
  const body = await res.json() as Record<string, unknown>
  if (!res.ok || (body as { error?: unknown }).error) {
    const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
    console.error(`[instagram] sendInstagramDM: ${errMsg}`)
    throw new Error(`[instagram] sendInstagramDM: ${errMsg}`)
  }
  return body as { recipient_id: string; message_id: string }
}

// ─── Get Instagram Profile ────────────────────────────────────────────────────

export async function getInstagramProfile(
  igUserId: string,
  accessToken: string,
  apiBase?: string
): Promise<{ username: string; name: string; profile_picture_url: string } | null> {
  const base = apiBase ?? GRAPH_API
  try {
    const res = await fetch(
      `${base}/${igUserId}?fields=username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
    )
    const body = await res.json() as Record<string, unknown>
    if (!res.ok || (body as { error?: unknown }).error) {
      const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
      console.error(`[instagram] getInstagramProfile: ${errMsg}`)
      return null
    }
    return body as { username: string; name: string; profile_picture_url: string }
  } catch (err) {
    console.error(`[instagram] getInstagramProfile: ${err}`)
    return null
  }
}

// ─── Check Follower Status ────────────────────────────────────────────────────

export async function checkFollowerStatus(
  igAccountId: string,
  igUserId: string,
  accessToken: string,
  apiBase?: string
): Promise<boolean> {
  const base = apiBase ?? GRAPH_API
  try {
    const res = await fetch(
      `${base}/${igAccountId}/followers?user_id=${igUserId}&access_token=${encodeURIComponent(accessToken)}`
    )
    const body = await res.json() as Record<string, unknown>
    if (!res.ok || (body as { error?: unknown }).error) {
      const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
      console.error(`[instagram] checkFollowerStatus: ${errMsg}`)
      return false
    }
    const data = (body as { data?: unknown[] }).data
    return Array.isArray(data) && data.length > 0
  } catch (err) {
    console.error(`[instagram] checkFollowerStatus: ${err}`)
    return false
  }
}

// ─── Get Media Comments ───────────────────────────────────────────────────────

export async function getMediaComments(
  mediaId: string,
  accessToken: string,
  after?: string,
  apiBase?: string
): Promise<{
  data: Array<{
    id: string
    text: string
    from: { id: string; username: string }
    timestamp: string
  }>
  paging?: { cursors: { after: string }; next?: string }
}> {
  const base = apiBase ?? GRAPH_API
  let url = `${base}/${mediaId}/comments?fields=id,text,from{id,username},timestamp&limit=50&access_token=${encodeURIComponent(accessToken)}`
  if (after) {
    url += `&after=${encodeURIComponent(after)}`
  }
  const res = await fetch(url)
  const body = await res.json() as Record<string, unknown>
  if (!res.ok || (body as { error?: unknown }).error) {
    const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
    console.error(`[instagram] getMediaComments: ${errMsg}`)
    throw new Error(`[instagram] getMediaComments: ${errMsg}`)
  }
  return body as {
    data: Array<{
      id: string
      text: string
      from: { id: string; username: string }
      timestamp: string
    }>
    paging?: { cursors: { after: string }; next?: string }
  }
}

// ─── Get Recent Media ─────────────────────────────────────────────────────────

export async function getRecentMedia(
  igAccountId: string,
  accessToken: string,
  limit = 25,
  apiBase?: string
): Promise<
  Array<{
    id: string
    caption: string
    media_type: string
    timestamp: string
    permalink: string
  }>
> {
  const base = apiBase ?? GRAPH_API
  const url = `${base}/${igAccountId}/media?fields=id,caption,media_type,timestamp,permalink&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url)
  const body = await res.json() as Record<string, unknown>
  if (!res.ok || (body as { error?: unknown }).error) {
    const errMsg = (body as { error?: { message?: string } }).error?.message ?? res.statusText
    console.error(`[instagram] getRecentMedia: ${errMsg}`)
    throw new Error(`[instagram] getRecentMedia: ${errMsg}`)
  }
  const data = (body as { data?: unknown[] }).data ?? []
  return data as Array<{
    id: string
    caption: string
    media_type: string
    timestamp: string
    permalink: string
  }>
}

// ─── Subscribe Instagram Webhooks ────────────────────────────────────────────

export async function subscribeInstagramWebhooks(
  pageId: string,
  accessToken: string,
  apiBase?: string
): Promise<boolean> {
  const base = apiBase ?? GRAPH_API
  try {
    const res = await fetch(`${base}/${pageId}/subscribed_apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subscribed_fields: ["feed", "messages"],
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
      console.error(`[instagram] subscribeInstagramWebhooks: ${body.error?.message ?? res.statusText}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`[instagram] subscribeInstagramWebhooks: ${err}`)
    return false
  }
}

// ─── Get Org Instagram Config ─────────────────────────────────────────────────

export async function getOrgInstagramConfig(
  orgId: string
): Promise<{
  ig_account_id: string
  page_id: string
  page_access_token: string
  ig_username: string
  api_base: string
  connection_type: "instagram_login" | "facebook_login"
} | null> {
  const igIntegration = await prisma.org_integrations.findFirst({
    where: { org_id: orgId, platform: "instagram", is_active: true },
    select: { config: true },
  })
  if (igIntegration) {
    const config = igIntegration.config as Record<string, unknown>
    if (config.ig_account_id) {
      return {
        ig_account_id: config.ig_account_id as string,
        page_id: "",
        page_access_token: config.access_token as string,
        ig_username: (config.ig_username as string) ?? "",
        api_base: (config.api_base as string) ?? IG_GRAPH_API,
        connection_type: "instagram_login",
      }
    }
  }
  return null
}
