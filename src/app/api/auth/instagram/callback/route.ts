import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authResult = await getAuthUser()
  if ("error" in authResult) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")
  const slug = req.nextUrl.searchParams.get("state") ?? ""

  const settingsUrl = new URL(`/${slug}/instagram`, req.url)

  if (error || !code || !slug) {
    settingsUrl.searchParams.set("error", error ?? "missing_params")
    return NextResponse.redirect(settingsUrl.toString())
  }

  const appId = process.env.INSTAGRAM_APP_ID
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  if (!appId || !appSecret) {
    settingsUrl.searchParams.set("error", "config_missing")
    return NextResponse.redirect(settingsUrl.toString())
  }

  const org = await prisma.organizations.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!org) {
    settingsUrl.searchParams.set("error", "org_not_found")
    return NextResponse.redirect(settingsUrl.toString())
  }

  const baseUrl = req.headers.get("x-forwarded-host")
    ? `https://${req.headers.get("x-forwarded-host")}`
    : `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      user_id?: number
      error_message?: string
    }
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[instagram] Token exchange failed:", tokenData)
      settingsUrl.searchParams.set("error", "token_exchange_failed")
      return NextResponse.redirect(settingsUrl.toString())
    }

    // 2. Exchange for long-lived token (60-day)
    let accessToken = tokenData.access_token
    let expiresIn = 3600
    try {
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(accessToken)}`
      )
      const longData = (await longRes.json()) as {
        access_token?: string
        expires_in?: number
        error?: { message?: string }
      }
      if (longData.access_token) {
        accessToken = longData.access_token
        expiresIn = longData.expires_in ?? 5184000
      }
    } catch (err) {
      console.error("[instagram] Long-lived token exchange error:", err)
    }

    // 3. Fetch user profile
    let igUserId = String(tokenData.user_id)
    let igUsername = ""
    let igName = ""
    let profilePicUrl = ""
    try {
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=user_id,username,name,profile_picture_url,account_type&access_token=${encodeURIComponent(accessToken)}`
      )
      const me = (await meRes.json()) as {
        user_id?: string
        username?: string
        name?: string
        profile_picture_url?: string
        error?: { message?: string }
      }
      if (me.user_id) {
        igUserId = me.user_id
        igUsername = me.username ?? ""
        igName = me.name ?? ""
        profilePicUrl = me.profile_picture_url ?? ""
      }
    } catch (err) {
      console.error("[instagram] Profile fetch error:", err)
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // 4. Upsert integration
    await prisma.org_integrations.upsert({
      where: {
        org_id_platform: { org_id: org.id, platform: "instagram" },
      },
      create: {
        org_id: org.id,
        platform: "instagram",
        is_active: true,
        config: {
          ig_account_id: igUserId,
          ig_username: igUsername,
          ig_name: igName,
          profile_picture_url: profilePicUrl,
          access_token: accessToken,
          token_expires_at: expiresAt,
          connection_type: "instagram_login",
          api_base: "https://graph.instagram.com/v21.0",
        },
      },
      update: {
        is_active: true,
        config: {
          ig_account_id: igUserId,
          ig_username: igUsername,
          ig_name: igName,
          profile_picture_url: profilePicUrl,
          access_token: accessToken,
          token_expires_at: expiresAt,
          connection_type: "instagram_login",
          api_base: "https://graph.instagram.com/v21.0",
        },
      },
    })

    // Auto-sync DMs
    try {
      const syncRes = await fetch(`${baseUrl}/api/orgs/${slug}/instagram/sync`, {
        method: "POST",
        headers: { cookie: req.headers.get("cookie") ?? "" },
      })
      if (syncRes.ok) {
        const syncData = (await syncRes.json()) as { synced?: number }
        console.log(`[instagram] Auto-synced ${syncData.synced} conversations`)
      }
    } catch {}

    settingsUrl.searchParams.set("connected", "true")
    return NextResponse.redirect(settingsUrl.toString())
  } catch (err) {
    console.error("[instagram] Callback error:", err)
    settingsUrl.searchParams.set("error", "unknown")
    return NextResponse.redirect(settingsUrl.toString())
  }
}
