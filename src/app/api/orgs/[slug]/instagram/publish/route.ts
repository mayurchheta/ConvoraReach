import { NextRequest, NextResponse } from "next/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { getOrgInstagramConfig } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "No Instagram integration configured" }, { status: 400 })
  }

  let body: { image_url?: string; caption?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { image_url, caption } = body
  if (!image_url) {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 })
  }

  const { ig_account_id, page_access_token, api_base } = config

  const containerRes = await fetch(`${api_base}/${ig_account_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url,
      caption: caption ?? "",
      access_token: page_access_token,
    }),
  })
  const containerBody = await containerRes.json() as Record<string, unknown>
  if (!containerRes.ok || (containerBody as { error?: unknown }).error) {
    const errMsg =
      (containerBody as { error?: { message?: string } }).error?.message ??
      containerRes.statusText
    return NextResponse.json({ error: errMsg }, { status: 502 })
  }
  const creation_id = (containerBody as { id?: string }).id
  if (!creation_id) {
    return NextResponse.json({ error: "No creation_id returned" }, { status: 502 })
  }

  const publishRes = await fetch(`${api_base}/${ig_account_id}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id,
      access_token: page_access_token,
    }),
  })
  const publishBody = await publishRes.json() as Record<string, unknown>
  if (!publishRes.ok || (publishBody as { error?: unknown }).error) {
    const errMsg =
      (publishBody as { error?: { message?: string } }).error?.message ??
      publishRes.statusText
    return NextResponse.json({ error: errMsg }, { status: 502 })
  }
  const media_id = (publishBody as { id?: string }).id

  return NextResponse.json({ published: true, media_id })
}
