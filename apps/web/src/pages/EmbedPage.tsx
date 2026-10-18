import { useEffect, useMemo, useState } from 'react'
import { getEvent } from '../lib/api'
import { buildPublicSnapshot } from '../lib/snapshot'
import { EventMap } from '../components/EventMap'
import type { Entry, EventRecord } from '../lib/types'

/** Compact embeddable widget for club sites. */
export function EmbedPage() {
  const [event, setEvent] = useState<EventRecord | null>(null)

  useEffect(() => {
    void getEvent().then(setEvent)
  }, [])

  const snap = useMemo(
    () => (event ? buildPublicSnapshot(event) : null),
    [event],
  )

  const riders: Entry[] = useMemo(() => {
    if (!snap) return []
    return snap.riders
      .filter((r) => r.lat != null)
      .map((r) => ({
        id: r.id,
        nickname: r.nickname,
        bib: r.bib,
        emergencyContact: '',
        consentTracking: true,
        visibility: 'public',
        status: r.status as Entry['status'],
        lastLat: r.lat,
        lastLng: r.lng,
      }))
  }, [snap])

  if (!event || !snap) {
    return <div style={{ padding: 12, fontFamily: 'sans-serif' }}>Loading…</div>
  }

  return (
    <div
      style={{
        fontFamily: 'IBM Plex Sans, sans-serif',
        padding: 12,
        background: '#f7f4ee',
        color: '#14201a',
      }}
    >
      <strong>{event.name}</strong>
      <div style={{ fontSize: 13, color: '#4a5c52', marginBottom: 8 }}>
        Delayed {event.publicDelayMinutes}m · {snap.riders.length} public riders
      </div>
      <EventMap
        controls={event.controls}
        riders={riders}
        height={260}
        delayed
      />
    </div>
  )
}
