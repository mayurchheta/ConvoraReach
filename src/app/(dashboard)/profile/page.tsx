"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, Camera, Lock, Save, ArrowLeft, LogOut } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarPreview, setAvatarPreview] = useState("")
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const res = await fetch("/api/auth/profile")
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { user: UserProfile }
      setProfile(data.user)
      setFullName(data.user.full_name)
      setEmail(data.user.email)
      setAvatarUrl(data.user.avatar_url ?? "")
      setAvatarPreview(data.user.avatar_url ?? "")
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
      if (data.user) {
        setProfile(data.user)
        setAvatarPreview(data.user.avatar_url ?? "")
      }
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
      if (!res.ok) throw new Error(data.error ?? "Failed")
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

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return }
    // Create local preview immediately
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    // Convert to base64 data URL for storage (no external upload needed for avatars)
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const initials = (profile?.full_name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Top bar */}
      <div className="border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/convora-icon-white.png" alt="Convora" width={28} height={28} className="rounded-md" />
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
            </Link>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your account settings</p>
        </div>

        {/* Avatar + Info */}
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-start gap-5">
            <div className="relative group shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile?.full_name ?? ""}
                  className="h-20 w-20 rounded-full object-cover border-2 border-zinc-700"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white border-2 border-zinc-700">
                  {initials}
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="h-5 w-5 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
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
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-purple-600 hover:bg-purple-700" size="sm">
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
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">New password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Confirm new password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword} variant="outline" size="sm">
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
    </div>
  )
}
