import { useEffect, useMemo, useState } from 'react'
import { EventMap } from '../components/EventMap'
import { getEvent, publicSnapshot } from '../lib/api'
import type { EventRecord, Entry } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { buildPublicSnapshot } from '../lib/snapshot'

export function PublicPage() {
  const { t } = useI18n()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [followEmail, setFollowEmail] = useState('')
  const [followMsg, setFollowMsg] = useState<string | null>(null)

  useEffect(() => {
    void getEvent().then(setEvent)
  }, [])

  const snap = useMemo(
    () => (event ? buildPublicSnapshot(event) : null),
    [event],
  )

  const mapRiders: Entry[] = useMemo(() => {
    if (!event || !snap) return []
    return snap.riders
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        id: r.id,
        nickname: r.nickname,
        bib: r.bib,
        emergencyContact: '',
        consentTracking: true,
        visibility: 'public' as const,
        status: r.status as Entry['status'],
        lastLat: r.lat,
        lastLng: r.lng,
        lastSeenAt: r.lastSeenAt,
        timeInHandMinutes: r.timeInHandMinutes ?? undefined,
      }))
  }, [event, snap])

  if (!event || !snap) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <section>
        <h1>{event.name}</h1>
        <p className="lead">
          No account needed. Positions delayed by {event.publicDelayMinutes}{' '}
          minutes. Snapshot generated {new Date(snap.generatedAt).toLocaleTimeString()}.
        </p>
      </section>

      <section className="panel">
        <EventMap
          controls={event.controls}
          riders={mapRiders}
          height={320}
          delayed
        />
      </section>

      <section className="panel">
        <h2>Progress</h2>
        {snap.riders.length === 0 && (
          <p className="muted">No public riders visible yet.</p>
        )}
        {snap.riders.map((e) => (
          <div className="rider-card" key={e.id}>
            <div>
              <strong>
                #{e.bib} {e.nickname}
              </strong>{' '}
              <span className="muted">· {e.status}</span>
            </div>
            <div className="muted">
              {e.lastSeenAt
                ? `Last public fix ${new Date(e.lastSeenAt).toLocaleTimeString()}`
                : 'Waiting for delayed position…'}
              {e.nextControl
                ? ` · Next ${e.nextControl.name} (${e.nextControl.km} km)`
                : ''}
            </div>
            <div className="actions" style={{ marginTop: 8 }}>
              <input
                placeholder="Email to follow"
                value={followEmail}
                onChange={(ev) => setFollowEmail(ev.target.value)}
                style={{ maxWidth: 220 }}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const follows = JSON.parse(
                    localStorage.getItem('brmtracker.follows') || '[]',
                  ) as { entryId: string; email: string }[]
                  follows.push({ entryId: e.id, email: followEmail })
                  localStorage.setItem(
                    'brmtracker.follows',
                    JSON.stringify(follows),
                  )
                  setFollowMsg(
                    `Follow saved locally for ${e.nickname}. ${t('followSoon')}`,
                  )
                }}
              >
                Follow
              </button>
            </div>
          </div>
        ))}
        {followMsg && <p className="ok">{followMsg}</p>}
      </section>

      <section className="panel">
        <h2>Embed</h2>
        <p className="muted">
          Club sites can iframe{' '}
          <code>/embed</code> — see embed route for a compact widget.
        </p>
        <pre style={{ overflow: 'auto', fontSize: 12 }}>
          {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed" width="100%" height="420" frameborder="0"></iframe>`}
        </pre>
        <details>
          <summary>Snapshot JSON (public scale path)</summary>
          <pre style={{ overflow: 'auto', fontSize: 11, maxHeight: 200 }}>
            {JSON.stringify(publicSnapshot(event), null, 2)}
          </pre>
        </details>
      </section>
    </div>
  )
}
