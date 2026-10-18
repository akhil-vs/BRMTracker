import type { Control, Entry } from './types'

/** Crow-flies / remaining-km heuristic for time in hand (minutes). */
export function computeTimeInHand(
  entry: Pick<Entry, 'lastLat' | 'lastLng' | 'status'>,
  next: Control | undefined,
  now = Date.now(),
): number | undefined {
  if (!next || entry.status === 'finished' || entry.status === 'abandoned') {
    return undefined
  }

  const closeMs = new Date(next.closeAt).getTime()
  const minutesUntilClose = (closeMs - now) / 60_000

  let remainingKm = next.km
  if (
    entry.lastLat != null &&
    entry.lastLng != null &&
    next.lat != null &&
    next.lng != null
  ) {
    remainingKm = haversineKm(
      entry.lastLat,
      entry.lastLng,
      next.lat,
      next.lng,
    )
  }

  // Assume ~15 km/h minimum ACP pace for projection
  const needMinutes = (remainingKm / 15) * 60
  return Math.round(minutesUntilClose - needMinutes)
}

export function nextControlForEntry(
  controls: Control[],
  checkins: { entryId: string; controlId: string; undoneAt?: string }[],
  entryId: string,
): Control | undefined {
  const done = new Set(
    checkins
      .filter((c) => c.entryId === entryId && !c.undoneAt)
      .map((c) => c.controlId),
  )
  const sorted = [...controls].sort((a, b) => a.seq - b.seq)
  return sorted.find((c) => !done.has(c.id)) ?? sorted[sorted.length - 1]
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function deriveAlerts(
  entry: Entry,
  timeInHand: number | undefined,
  now = Date.now(),
): { type: 'stopped' | 'cutoff_risk' | 'sos'; message: string }[] {
  const out: { type: 'stopped' | 'cutoff_risk' | 'sos'; message: string }[] = []
  if (timeInHand != null && timeInHand < 20) {
    out.push({
      type: 'cutoff_risk',
      message: `Only ${timeInHand} min time in hand`,
    })
  }
  if (entry.lastSeenAt) {
    const ageMin = (now - new Date(entry.lastSeenAt).getTime()) / 60_000
    if (ageMin > 45 && entry.status === 'started') {
      out.push({
        type: 'stopped',
        message: `No movement / update for ${Math.round(ageMin)} min`,
      })
    }
  }
  return out
}
