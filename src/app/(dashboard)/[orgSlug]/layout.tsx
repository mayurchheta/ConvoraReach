"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  Zap,
  BarChart3,
  Users,
  Upload,
  Settings,
  LogOut,
  UserCircle,
  LayoutDashboard,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/instagram/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instagram/inbox", label: "DM Inbox", icon: MessageCircle },
  { href: "/instagram/automations", label: "Automations", icon: Zap },
  { href: "/instagram/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/instagram/contacts", label: "Contacts", icon: Users },
  { href: "/instagram/publish", label: "Publish", icon: Upload },
  { href: "/instagram", label: "Settings", icon: Settings },
]

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href={`/${orgSlug}/instagram`} className="flex items-center gap-2.5">
            <Image
              src="/convora-icon-white.png"
              alt="Convora Reach"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <span className="text-sm font-semibold text-white">Convora Reach</span>
              <span className="block text-[10px] text-zinc-500 -mt-0.5">{orgSlug}</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const fullHref = `/${orgSlug}${item.href}`
            const isActive =
              pathname === fullHref ||
              (item.href !== "/instagram" && pathname.startsWith(fullHref))

            return (
              <Link
                key={item.href}
                href={fullHref}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-600/15 text-purple-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 space-y-0.5">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/profile"
                ? "bg-purple-600/15 text-purple-400"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
            )}
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <p className="text-[10px] text-zinc-700 px-3 pt-1">Convora Reach v0.1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-900">
        {children}
      </main>
    </div>
  )
}
