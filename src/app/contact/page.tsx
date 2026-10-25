"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MessageSquare, ArrowLeft } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      setStatus("sent")
      setName("")
      setEmail("")
      setMessage("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/convora-icon-white.png" alt="Convora" width={28} height={28} className="rounded-md" />
            <span className="text-lg font-bold tracking-tight">Convora Reach</span>
          </Link>
          <Link href="/login" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-700">
            Log in
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-zinc-400 mb-10">
          Have a question, feedback, or need help? We&apos;d love to hear from you.
        </p>

        <div className="grid gap-10 md:grid-cols-[1fr_auto]">
          {/* Form */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <MessageSquare className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Message sent!</h3>
                <p className="text-sm text-zinc-400">We&apos;ll get back to you as soon as possible.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    required
                    rows={5}
                    className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2.5 text-sm text-red-300">
                    Failed to send message. Please try again or email us directly.
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>

          {/* Direct contact */}
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <Mail className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-white">Email</span>
              </div>
              <a href="mailto:convora.io@gmail.com" className="text-zinc-400 hover:text-purple-400 transition-colors">
                convora.io@gmail.com
              </a>
            </div>
            <p className="text-xs text-zinc-600 px-1">
              We typically respond within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
