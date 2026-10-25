"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, Camera, Lock, Save } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  // Avatar upload
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    try {
      const res = await fetch("/api/auth/profile")
      if (!res.ok) throw new Error("Failed to load profile")
      const data = (await res.json()) as { user: UserProfile }
      setProfile(data.user)
      setFullName(data.user.full_name)
      setEmail(data.user.email)
      setAvatarUrl(data.user.avatar_url ?? "")
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      })
      const data = (await res.json()) as { user?: UserProfile; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Save failed")
      setProfile(data.user ?? null)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Password change failed")
      toast.success("Password updated")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed")
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/upload`, {
        method: "POST",
        body: formData,
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed")
      setAvatarUrl(data.url)
      toast.success("Avatar uploaded — click Save to apply")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded" />
        <div className="h-64 bg-zinc-800 animate-pulse rounded-xl" />
      </div>
    )
  }

  const initials = (profile?.full_name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account settings</p>
      </div>

      {/* Avatar + Info */}
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.full_name ?? ""}
                className="h-20 w-20 rounded-full object-cover border-2 border-zinc-700"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white border-2 border-zinc-700">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Avatar URL <span className="text-zinc-600 font-normal">(or upload above)</span>
              </label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold">Change Password</h2>
        </div>

        <div className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Confirm new password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            variant="outline"
            size="sm"
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Card>

      {/* Account Info */}
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold">Account Info</h2>
        </div>
        <div className="text-sm text-zinc-500 space-y-1">
          <p>User ID: <span className="text-zinc-400 font-mono text-xs">{profile?.id}</span></p>
          <p>Member since: <span className="text-zinc-400">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span></p>
        </div>
      </Card>
    </div>
  )
}
