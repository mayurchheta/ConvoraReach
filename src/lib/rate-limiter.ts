// DM Rate Limiter — prevents Meta from throttling or banning
// Max 200 DMs per hour per org, minimum 12 seconds between sends

const MAX_DMS_PER_HOUR = 200
const MIN_SPACING_MS = 12_000 // 12 seconds

interface OrgDMTracker {
  timestamps: number[]
  lastSentAt: number
}

const trackers = new Map<string, OrgDMTracker>()

function getTracker(orgId: string): OrgDMTracker {
  if (!trackers.has(orgId)) {
    trackers.set(orgId, { timestamps: [], lastSentAt: 0 })
  }
  return trackers.get(orgId)!
}

function pruneOldTimestamps(tracker: OrgDMTracker) {
  const oneHourAgo = Date.now() - 3600_000
  tracker.timestamps = tracker.timestamps.filter((t) => t > oneHourAgo)
}

export function canSendDM(orgId: string): {
  allowed: boolean
  reason?: string
  retryAfterMs?: number
} {
  const tracker = getTracker(orgId)
  pruneOldTimestamps(tracker)

  if (tracker.timestamps.length >= MAX_DMS_PER_HOUR) {
    const oldestInWindow = tracker.timestamps[0]
    const retryAfterMs = oldestInWindow + 3600_000 - Date.now()
    return {
      allowed: false,
      reason: `Hourly limit reached (${MAX_DMS_PER_HOUR}/hr)`,
      retryAfterMs,
    }
  }

  const timeSinceLast = Date.now() - tracker.lastSentAt
  if (timeSinceLast < MIN_SPACING_MS) {
    const retryAfterMs = MIN_SPACING_MS - timeSinceLast
    return {
      allowed: false,
      reason: "Rate limit spacing (12s between DMs)",
      retryAfterMs,
    }
  }

  return { allowed: true }
}

export function recordDMSent(orgId: string) {
  const tracker = getTracker(orgId)
  const now = Date.now()
  tracker.timestamps.push(now)
  tracker.lastSentAt = now
}

export function getDMStats(orgId: string): {
  sent_this_hour: number
  next_available_at: number | null
} {
  const tracker = getTracker(orgId)
  pruneOldTimestamps(tracker)

  const check = canSendDM(orgId)
  return {
    sent_this_hour: tracker.timestamps.length,
    next_available_at: check.allowed
      ? null
      : Date.now() + (check.retryAfterMs ?? 0),
  }
}

export async function waitForSlot(orgId: string): Promise<void> {
  const check = canSendDM(orgId)
  if (check.allowed) return
  await new Promise((resolve) =>
    setTimeout(resolve, check.retryAfterMs ?? MIN_SPACING_MS)
  )
}
