"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthLogo } from "@/components/auth-logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [step, setStep] = useState<"email" | "reset">("email")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = (await res.json()) as { error?: string; message?: string }

      if (!res.ok) {
        setError(data.error ?? "Failed to send reset code")
      } else {
        setSuccess(data.message ?? "Reset code sent to your email")
        setStep("reset")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          new_password: newPassword,
        }),
      })

      const data = (await res.json()) as { error?: string; message?: string }

      if (!res.ok) {
        setError(data.error ?? "Reset failed")
      } else {
        setSuccess("Password reset! You can now sign in.")
        setStep("email")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        <AuthLogo />

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
          {step === "email" ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-white">Reset password</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Enter your email to receive a reset code
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2.5 text-sm text-red-300">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg bg-emerald-950/50 border border-emerald-900 px-3 py-2.5 text-sm text-emerald-300">
                    {success}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-white">Enter reset code</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Check your email for a 6-digit code
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2.5 text-sm text-red-300">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg bg-emerald-950/50 border border-emerald-900 px-3 py-2.5 text-sm text-emerald-300">
                    {success}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Reset code</label>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500 text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">New password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setSuccess("") }}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Back to email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500">
          Remember your password?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
