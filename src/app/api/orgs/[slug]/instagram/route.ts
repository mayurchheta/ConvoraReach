import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOrgAccess, verifyOrgAdmin } from "@/lib/auth"
import { getOrgInstagramConfig, subscribeInstagramWebhooks } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAccess(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    ig_account_id: config.ig_account_id,
    ig_username: config.ig_username,
    connection_type: config.connection_type,
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  const config = await getOrgInstagramConfig(access.org.id)
  if (!config) {
    return NextResponse.json({ error: "No Instagram integration configured" }, { status: 400 })
  }

  const ok = await subscribeInstagramWebhooks(config.page_id, config.page_access_token, config.api_base)
  if (!ok) {
    return NextResponse.json({ error: "Failed to subscribe webhooks" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE: Disconnect Instagram
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  // Deactivate the instagram integration
  await prisma.org_integrations.updateMany({
    where: { org_id: access.org.id, platform: "instagram" },
    data: { is_active: false },
  })

  return NextResponse.json({ ok: true })
}