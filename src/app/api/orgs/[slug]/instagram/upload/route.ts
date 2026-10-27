import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
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

    // Vercel Blob — reliable public hosting that Instagram can fetch.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = file.name.split(".").pop() || "jpg"
      const key = `instagram/${access.org.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const blob = await put(key, file, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      })
      return NextResponse.json({ url: blob.url })
    }

    // Fallback: imgbb (if configured)
    const imgbbKey = process.env.IMGBB_API_KEY
    if (imgbbKey) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      const uploadForm = new URLSearchParams()
      uploadForm.set("image", base64)
      const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: uploadForm,
      })
      if (uploadRes.ok) {
        const uploadData = (await uploadRes.json()) as { data?: { url?: string; display_url?: string } }
        const publicUrl = uploadData.data?.display_url ?? uploadData.data?.url
        if (publicUrl) {
          return NextResponse.json({ url: publicUrl })
        }
      }
    }

    return NextResponse.json(
      { error: "Image upload is not configured. Please paste a public image URL instead." },
      { status: 500 }
    )
  } catch (err) {
    console.error("[instagram] Image upload error:", err)
    return NextResponse.json(
      { error: "Image upload failed. Please paste a public image URL instead." },
      { status: 500 }
    )
  }
}
