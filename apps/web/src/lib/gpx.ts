/** Minimal GPX parser for track points and waypoints → control proposals. */

export interface GpxPoint {
  lat: number
  lng: number
  ele?: number
  name?: string
}

export interface GpxParseResult {
  track: GpxPoint[]
  waypoints: GpxPoint[]
  totalKm: number
  proposedControls: { name: string; km: number; lat: number; lng: number }[]
}

function haversineKm(a: GpxPoint, b: GpxPoint): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function cumulativeKm(track: GpxPoint[]): number[] {
  const out = [0]
  let sum = 0
  for (let i = 1; i < track.length; i++) {
    sum += haversineKm(track[i - 1], track[i])
    out.push(sum)
  }
  return out
}

export function parseGpx(xml: string): GpxParseResult {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid GPX file')
  }

  const track: GpxPoint[] = []
  doc.querySelectorAll('trkpt').forEach((el) => {
    const lat = Number(el.getAttribute('lat'))
    const lng = Number(el.getAttribute('lon'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const ele = el.querySelector('ele')?.textContent
    track.push({
      lat,
      lng,
      ele: ele ? Number(ele) : undefined,
    })
  })

  const waypoints: GpxPoint[] = []
  doc.querySelectorAll('wpt').forEach((el) => {
    const lat = Number(el.getAttribute('lat'))
    const lng = Number(el.getAttribute('lon'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    waypoints.push({
      lat,
      lng,
      name: el.querySelector('name')?.textContent ?? undefined,
    })
  })

  if (track.length < 2 && waypoints.length >= 2) {
    // Use waypoints as a coarse track
    track.push(...waypoints)
  }

  const cum = cumulativeKm(track)
  const totalKm = cum.length ? cum[cum.length - 1] : 0

  const proposedControls: GpxParseResult['proposedControls'] = []

  if (waypoints.length > 0 && track.length > 0) {
    for (const w of waypoints) {
      let bestI = 0
      let bestD = Infinity
      for (let i = 0; i < track.length; i++) {
        const d = haversineKm(w, track[i])
        if (d < bestD) {
          bestD = d
          bestI = i
        }
      }
      proposedControls.push({
        name: w.name ?? `Control @ ${cum[bestI].toFixed(0)} km`,
        km: Math.round(cum[bestI] * 10) / 10,
        lat: w.lat,
        lng: w.lng,
      })
    }
    proposedControls.sort((a, b) => a.km - b.km)
  } else if (track.length > 0) {
    const start = track[0]
    const finish = track[track.length - 1]
    proposedControls.push({
      name: 'Start',
      km: 0,
      lat: start.lat,
      lng: start.lng,
    })
    const thirds = [0.3, 0.6].map((f) => {
      const target = totalKm * f
      let i = 0
      while (i < cum.length - 1 && cum[i] < target) i++
      return {
        name: `Control ${proposedControls.length}`,
        km: Math.round(cum[i] * 10) / 10,
        lat: track[i].lat,
        lng: track[i].lng,
      }
    })
    proposedControls.push(...thirds)
    proposedControls.push({
      name: 'Finish',
      km: Math.round(totalKm * 10) / 10,
      lat: finish.lat,
      lng: finish.lng,
    })
    // fix control names
    proposedControls.forEach((c, i) => {
      if (i > 0 && i < proposedControls.length - 1) c.name = `Control ${i}`
    })
  }

  return { track, waypoints, totalKm, proposedControls }
}
