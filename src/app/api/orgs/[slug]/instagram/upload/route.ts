import { NextRequest, NextResponse } from "next/server"
import { verifyOrgAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const access = await verifyOrgAdmin(slug)
  if ("error" in access) return access.error

  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image (JPEG, PNG)" }, { status: 400 })
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const imgbbKey = process.env.IMGBB_API_KEY
    if (!imgbbKey) {
      return NextResponse.json({ error: "Image upload not configured. Please use an image URL instead." }, { status: 500 })
    }

    const uploadForm = new URLSearchParams()
    uploadForm.set("image", base64)
    uploadForm.set("expiration", "600")

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: "POST",
      body: uploadForm,
    })

    if (!uploadRes.ok) {
      const freeimageKey = process.env.FREEIMAGE_API_KEY ?? ""
      const fallbackForm = new URLSearchParams()
      fallbackForm.set("source", base64)
      fallbackForm.set("type", "base64")
      fallbackForm.set("action", "upload")

      const fallbackRes = await fetch(`https://freeimage.host/api/1/upload?key=${freeimageKey}`, {
        method: "POST",
        body: fallbackForm,
      })

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: "Failed to upload image. Please use an image URL instead." }, { status: 502 })
      }

      const fallbackData = (await fallbackRes.json()) as { image?: { url?: string } }
      if (!fallbackData.image?.url) {
        return NextResponse.json({ error: "Upload failed — no URL returned" }, { status: 502 })
      }

      return NextResponse.json({ url: fallbackData.image.url })
    }

    const uploadData = (await uploadRes.json()) as { data?: { url?: string; display_url?: string } }
    const publicUrl = uploadData.data?.display_url ?? uploadData.data?.url

    if (!publicUrl) {
      return NextResponse.json({ error: "Upload succeeded but no URL returned" }, { status: 502 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error("[instagram] Image upload error:", err)
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 })
  }
}
