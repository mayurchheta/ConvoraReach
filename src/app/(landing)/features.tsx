"use client"

import {
  MessageCircle,
  Mail,
  UserPlus,
  Inbox,
  BarChart3,
  Image,
  Rewind,
  ShieldCheck,
} from "lucide-react"

const features = [
  {
    icon: MessageCircle,
    title: "Comment-to-DM Automation",
    description:
      "Auto-send DMs when followers comment specific keywords on your posts, reels, or stories.",
  },
  {
    icon: Mail,
    title: "Email & Lead Capture",
    description:
      "Collect emails and phone numbers from followers before delivering your link or offer.",
  },
  {
    icon: UserPlus,
    title: "Follow Gate",
    description:
      "Require users to follow your account before receiving the DM — grow followers on autopilot.",
  },
  {
    icon: Inbox,
    title: "Smart DM Inbox",
    description:
      "View and reply to all Instagram DMs from one unified inbox. Never miss a conversation.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track automation performance, DM delivery, email captures, and native Instagram insights.",
  },
  {
    icon: Image,
    title: "Content Publishing",
    description:
      "Publish images directly to your Instagram feed with captions — no switching apps.",
  },
  {
    icon: Rewind,
    title: "Rewind / Catch-Up",
    description:
      "Retroactively send DMs to commenters on past posts. Never miss an opportunity.",
  },
  {
    icon: ShieldCheck,
    title: "Rate-Limited & Safe",
    description:
      "Built-in rate limiting and opt-out handling. Fully compliant with Meta's platform policies.",
  },
]

export function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <feature.icon className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-100">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-400">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  )
}
