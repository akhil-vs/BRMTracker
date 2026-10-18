import type { EventRecord } from './types'
import { computeTimeInHand, nextControlForEntry } from './timeInHand'

/** Build delayed public JSON (also used by scripts/generate-snapshot). */
export function buildPublicSnapshot(event: EventRecord, now = Date.now()) {
  const delayMs = event.publicDelayMinutes * 60_000

  const riders = event.entries
    .filter((e) => e.visibility === 'public' && e.consentTracking)
    .map((e) => {
      const ageOk =
        e.lastSeenAt && now - new Date(e.lastSeenAt).getTime() >= delayMs
      const next = nextControlForEntry(event.controls, event.checkins, e.id)
      const tih = computeTimeInHand(e, next, now)

      let lat = ageOk ? e.lastLat : undefined
      let lng = ageOk ? e.lastLng : undefined

      // Trim start/finish exposure using simple km proxies on control chain
      if (lat != null && lng != null && next) {
        const progressKm = estimateProgressKm(e, event)
        if (
          progressKm < event.trimStartKm ||
          progressKm > event.distanceKm - event.trimFinishKm
        ) {
          lat = undefined
          lng = undefined
        }
      }

      return {
        id: e.id,
        bib: e.bib,
        nickname: e.nickname,
        status: e.status,
        lat,
        lng,
        lastSeenAt: ageOk ? e.lastSeenAt : undefined,
        nextControl: next
          ? { name: next.name, km: next.km, closesAt: next.closeAt }
          : null,
        timeInHandMinutes: tih,
        etaNext:
          tih != null && next
            ? new Date(
                new Date(next.closeAt).getTime() - tih * 60_000,
              ).toISOString()
            : null,
      }
    })

  return {
    generatedAt: new Date(now).toISOString(),
    event: {
      id: event.id,
      name: event.name,
      clubName: event.clubName,
      distanceKm: event.distanceKm,
      startAt: event.startAt,
      status: event.status,
      publicDelayMinutes: event.publicDelayMinutes,
    },
    controls: event.controls.map((c) => ({
      id: c.id,
      seq: c.seq,
      name: c.name,
      km: c.km,
      lat: c.lat,
      lng: c.lng,
      openAt: c.openAt,
      closeAt: c.closeAt,
    })),
    riders,
  }
}

function estimateProgressKm(
  e: { lastLat?: number; lastLng?: number },
  event: EventRecord,
): number {
  if (e.lastLat == null || e.lastLng == null) return 0
  // Nearest control by distance as crude progress
  let best = 0
  let bestD = Infinity
  for (const c of event.controls) {
    if (c.lat == null || c.lng == null) continue
    const d =
      (c.lat - e.lastLat) ** 2 + (c.lng - e.lastLng) ** 2
    if (d < bestD) {
      bestD = d
      best = c.km
    }
  }
  return best
}
