import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/lib/auth-full"
import { prisma } from "@/lib/prisma"
import { FeaturesGrid } from "./(landing)/features"

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.id) {
    const membership = await prisma.org_memberships.findFirst({
      where: { user_id: session.user.id, is_active: true },
      include: { org: { select: { slug: true } } },
      orderBy: { created_at: "asc" },
    })

    if (membership) {
      redirect(`/${membership.org.slug}/instagram`)
    }
  }

  // Unauthenticated (or no org) — render landing page
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/convora-icon-white.png"
              alt="Convora"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-lg font-bold tracking-tight text-zinc-100">
              Convora Reach
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Convora Reach
          </span>
        </h1>
        <p className="mb-4 text-xl font-medium text-zinc-200 sm:text-2xl">
          Instagram DM Automation for Creators &amp; Businesses
        </p>
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Automate comment replies, send DMs, capture emails, and grow your
          audience — all through Instagram&apos;s official API.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/30"
        >
          Get Started
        </Link>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-2 text-center text-3xl font-bold text-zinc-100">
          Everything you need
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-zinc-400">
          Powerful Instagram automation tools — built on the official API, so
          your account stays safe.
        </p>
        <FeaturesGrid />
      </section>

      {/* How It Works */}
      <section className="border-t border-zinc-800/50 bg-zinc-900/30 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-100">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect your account",
                description:
                  "Link your Instagram Business or Creator account through a secure OAuth flow.",
              },
              {
                step: "2",
                title: "Create automations",
                description:
                  "Set up keyword-triggered automations that send DMs when followers comment on your posts.",
              },
              {
                step: "3",
                title: "Watch it work",
                description:
                  "DMs send automatically when followers engage. Track performance in your dashboard.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-lg font-bold text-purple-400">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="mb-10 text-center text-3xl font-bold text-zinc-100">
          Built for trust &amp; compliance
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Built on Instagram's Official API",
            "Meta App Review Approved",
            "GDPR Compliant — Data Deletion Available",
          ].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center"
            >
              <p className="text-sm font-medium text-zinc-300">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <Link href="/privacy" className="underline hover:text-zinc-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline hover:text-zinc-300">
            Terms of Service
          </Link>
          <Link href="/data-deletion" className="underline hover:text-zinc-300">
            Data Deletion
          </Link>
          <Link href="/contact" className="underline hover:text-zinc-300">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-zinc-500">
            &copy; 2026 Convora Reach. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
            <Link href="/data-deletion" className="hover:text-zinc-300">
              Data Deletion
            </Link>
            <Link href="/contact" className="hover:text-zinc-300">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
