"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"

export function ConnectInstagramPrompt({ feature }: { feature: string }) {
  const { orgSlug } = useParams<{ orgSlug: string }>()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
        <Camera className="h-7 w-7 text-purple-400" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Connect Instagram to use {feature}</h2>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">
        Link your Instagram Professional account first, then come back to {feature.toLowerCase()}.
      </p>
      <Link href={`/${orgSlug}/instagram`}>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Go to Settings
        </Button>
      </Link>
    </div>
  )
}
