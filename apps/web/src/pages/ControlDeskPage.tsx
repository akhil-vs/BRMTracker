import { useEffect, useMemo, useState } from 'react'
import { confirmCheckin, getEvent, undoCheckin } from '../lib/api'
import { useAuth } from '../lib/authContext'
import type { EventRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'

export function ControlDeskPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [controlId, setControlId] = useState('')
  const [volunteerOverride, setVolunteerOverride] = useState<string | null>(null)
  const volunteer = volunteerOverride ?? user?.displayName ?? 'Volunteer'
  const [query, setQuery] = useState('')

  useEffect(() => {
    void getEvent().then((ev) => {
      setEvent(ev)
      setControlId(ev.controls[1]?.id ?? ev.controls[0]?.id ?? '')
    })
  }, [])

  const activeCheckins = useMemo(
    () => (event?.checkins ?? []).filter((c) => !c.undoneAt),
    [event],
  )

  if (!event) return <p className="muted">Loading…</p>

  const filtered = event.entries.filter((e) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      e.bib.toLowerCase().includes(q) || e.nickname.toLowerCase().includes(q)
    )
  })

  return (
    <div className="stack">
      <section>
        <h1>{t('controlDesk')}</h1>
        <p className="lead">
          HQ laptop fallback. Field volunteers should use the <strong>Android app</strong>{' '}
          Volunteer → Desk mode. Large buttons, bib search, undo nearby.
        </p>
      </section>

      <section className="panel stack">
        <div className="grid two">
          <label>
            This control
            <select
              value={controlId}
              onChange={(e) => setControlId(e.target.value)}
            >
              {event.controls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.seq}. {c.name} ({c.km} km)
                </option>
              ))}
            </select>
          </label>
          <label>
            Volunteer name
            <input
              value={volunteer}
              onChange={(e) => setVolunteerOverride(e.target.value)}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Find by bib or nickname
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="101 or Ghat"
              autoFocus
              style={{ fontSize: '1.15rem', padding: '0.85rem' }}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Riders</h2>
        {filtered.map((e) => {
          const already = activeCheckins.find(
            (c) => c.entryId === e.id && c.controlId === controlId,
          )
          return (
            <div className="rider-card" key={e.id}>
              <div style={{ fontSize: '1.15rem' }}>
                <strong>
                  #{e.bib} {e.nickname}
                </strong>
              </div>
              {already ? (
                <div className="actions">
                  <span className="ok">
                    Confirmed {new Date(already.checkedAt).toLocaleTimeString()}
                    {already.late ? ' (late)' : ''} by {already.confirmedBy}
                  </span>
                  <button
                    type="button"
                    className="secondary"
                    style={{ minHeight: 48 }}
                    onClick={async () => setEvent(await undoCheckin(already.id))}
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  style={{ minHeight: 52, fontSize: '1.05rem' }}
                  onClick={async () => {
                    if (!controlId) return
                    setEvent(
                      await confirmCheckin(
                        e.id,
                        controlId,
                        volunteer.trim() || 'Volunteer',
                      ),
                    )
                  }}
                >
                  Confirm arrival
                </button>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
