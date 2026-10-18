import { useEffect, useMemo, useState } from 'react'
import { EventMap } from '../components/EventMap'
import { getEvent, resolveAlert } from '../lib/api'
import type { EventRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'

export function ControlRoomPage() {
  const { t } = useI18n()
  const [event, setEvent] = useState<EventRecord | null>(null)

  useEffect(() => {
    void getEvent().then(setEvent)
    const id = window.setInterval(() => void getEvent().then(setEvent), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const sorted = useMemo(() => {
    if (!event) return []
    return [...event.entries].sort(
      (a, b) => (a.timeInHandMinutes ?? 999) - (b.timeInHandMinutes ?? 999),
    )
  }, [event])

  if (!event) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <section>
        <h1>{t('controlRoom')}</h1>
        <p className="lead">
          Staff view (no public delay). Sorted by risk — lowest time in hand first.
        </p>
      </section>

      {(event.alerts ?? []).filter((a) => a.active && a.type === 'sos').length >
        0 && (
        <section className="panel">
          <h2 className="danger">SOS</h2>
          {event.alerts
            .filter((a) => a.active && a.type === 'sos')
            .map((a) => {
              const rider = event.entries.find((e) => e.id === a.entryId)
              return (
                <div className="rider-card" key={a.id}>
                  <strong>
                    #{rider?.bib} {rider?.nickname}
                  </strong>{' '}
                  — {a.message}
                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={async () => setEvent(await resolveAlert(a.id))}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              )
            })}
        </section>
      )}

      <section className="panel">
        <EventMap controls={event.controls} riders={event.entries} height={320} />
      </section>

      <section className="panel">
        <h2>{event.name}</h2>
        {sorted.map((e) => {
          const tih = e.timeInHandMinutes
          const risk =
            tih == null ? '' : tih < 0 ? 'danger' : tih < 20 ? 'warn' : 'ok'
          const alerts = (event.alerts ?? []).filter(
            (a) => a.entryId === e.id && a.active && a.type !== 'sos',
          )
          return (
            <div className="rider-card" key={e.id}>
              <div>
                <strong>
                  #{e.bib} {e.nickname}
                </strong>{' '}
                <span className="muted">
                  · {e.status}
                  {e.wave ? ` · wave ${e.wave}` : ''}
                  {e.batteryPct != null ? ` · ${e.batteryPct}%` : ''}
                </span>
              </div>
              <div className={risk}>
                Time in hand: {tih == null ? '—' : `${tih} min`}
              </div>
              <div className="muted">
                Last seen:{' '}
                {e.lastSeenAt
                  ? `${new Date(e.lastSeenAt).toLocaleTimeString()} @ ${e.lastLat?.toFixed(3)}, ${e.lastLng?.toFixed(3)}`
                  : 'not tracking yet'}
              </div>
              {alerts.map((a) => (
                <div key={a.id} className="warn">
                  {a.type}: {a.message}
                </div>
              ))}
            </div>
          )
        })}
      </section>
      <p className="muted">{t('sosDisclaimer')}</p>
    </div>
  )
}
