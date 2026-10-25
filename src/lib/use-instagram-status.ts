"use client"

import { useState, useEffect } from "react"

export function useInstagramStatus(orgSlug: string) {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/instagram`)
      .then(res => res.json())
      .then((data: { connected: boolean }) => setConnected(data.connected))
      .catch(() => setConnected(false))
  }, [orgSlug])

  return connected
}
