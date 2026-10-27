"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthLogo } from "@/components/auth-logo"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          org_name: orgName.trim() || undefined,
        }),
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Registration failed")
        setLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        window.location.assign("/login?registered=true")
      } else {
        window.location.assign("/instagram/dashboard")
      }
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <AuthLogo />

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Create account</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Get started with Instagram DM automation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Full name</label>
              <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required autoComplete="name" disabled={loading} className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" disabled={loading} className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} autoComplete="new-password" disabled={loading} className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Workspace name <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <Input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Business" autoComplete="organization" disabled={loading} className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500" />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Creating account...</>) : "Create Account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
