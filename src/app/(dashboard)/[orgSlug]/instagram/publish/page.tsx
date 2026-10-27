"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useInstagramStatus } from "@/lib/use-instagram-status"
import { ConnectInstagramPrompt } from "@/components/connect-prompt"
import {
  PenSquare,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Upload,
  Link2,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react"

const MAX_CAPTION = 2200

type InputMode = "upload" | "url"

export default function InstagramPublishPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const igConnected = useInstagramStatus(orgSlug)

  const [inputMode, setInputMode] = useState<InputMode>("upload")
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishedMediaId, setPublishedMediaId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG)")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB")
      return
    }

    // Show local preview
    setPreviewUrl(URL.createObjectURL(file))
    setFileName(file.name)

    // Upload to get public URL
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch(`/api/orgs/${orgSlug}/instagram/upload`, {
        method: "POST",
        body: formData,
      })
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed")
      }
      setImageUrl(json.url)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
      setPreviewUrl(null)
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }

  function clearImage() {
    setImageUrl("")
    setPreviewUrl(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl.trim()) {
      toast.error("Please provide an image")
      return
    }

    setPublishing(true)
    setPublishedMediaId(null)
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl.trim(), caption }),
      })
      const json = (await res.json()) as {
        published?: boolean
        media_id?: string
        error?: string
      }
      if (!res.ok || !json.published) {
        throw new Error(json.error ?? "Publish failed")
      }
      setPublishedMediaId(json.media_id ?? null)
      toast.success("Post published successfully!")
      clearImage()
      setCaption("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed")
    } finally {
      setPublishing(false)
    }
  }

  const captionCharsLeft = MAX_CAPTION - caption.length
  const captionOverLimit = captionCharsLeft < 0
  const hasImage = !!imageUrl.trim()

  if (igConnected === false) {
    return <div className="p-6"><ConnectInstagramPrompt feature="Publishing" /></div>
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/instagram">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-rose-400 to-pink-600 rounded-lg">
            <PenSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Publish Post</h1>
            <p className="text-xs text-muted-foreground">Publish a photo to your Instagram account</p>
          </div>
        </div>
      </div>

      {/* Success state */}
      {publishedMediaId && (
        <Card className="p-5 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 space-y-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-medium">Post published successfully!</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Media ID: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{publishedMediaId}</span>
          </p>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 font-medium"
          >
            View on Instagram
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Card>
      )}

      {/* Publish form */}
      <Card className="p-6 space-y-5">
        <form onSubmit={(e) => void handlePublish(e)} className="space-y-5">

          {/* Image source toggle */}
          <div className="space-y-3">
            <Label>Image</Label>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setInputMode("upload"); clearImage() }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  inputMode === "upload"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => { setInputMode("url"); clearImage() }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  inputMode === "url"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                Paste URL
              </button>
            </div>

            {inputMode === "upload" ? (
              <div>
                {previewUrl ? (
                  <div className="relative rounded-lg border border-border overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {uploading && (
                        <div className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Uploading...
                        </div>
                      )}
                      {!uploading && hasImage && (
                        <div className="bg-green-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearImage}
                        className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-2 bg-muted/80 text-xs text-muted-foreground truncate">
                      {fileName}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-pink-300 hover:bg-muted/30 transition-colors">
                    <div className="p-3 bg-muted rounded-full">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload an image</p>
                      <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 8MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => void handleFileSelect(e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={publishing}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a publicly accessible URL. Supported: JPEG, PNG. Max 8MB.
                </p>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Caption</Label>
              <span
                className={`text-xs ${
                  captionOverLimit
                    ? "text-red-500 font-medium"
                    : captionCharsLeft < 100
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {captionCharsLeft} characters remaining
              </span>
            </div>
            <Textarea
              id="caption"
              placeholder="Write a caption... #hashtags @mentions"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={publishing}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={publishing || uploading || !hasImage || captionOverLimit}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0"
          >
            {publishing ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</span>
            ) : (
              "Publish to Instagram"
            )}
          </Button>
        </form>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Posts are published immediately. The image is temporarily hosted for Instagram to fetch.
      </p>
    </div>
  )
}