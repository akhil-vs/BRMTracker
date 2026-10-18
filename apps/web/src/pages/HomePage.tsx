import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvent } from '../lib/api'
import type { EventRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'

export function HomePage() {
  const { t } = useI18n()
  const [event, setEvent] = useState<EventRecord | null>(null)

  useEffect(() => {
    void getEvent().then(setEvent)
  }, [])

  return (
    <div className="stack">
      <section>
        <h1>Admin console</h1>
        <p className="lead">
          Set up brevets, watch HQ control room, export results. Riders and field
          volunteers use the <strong>Android app</strong> (one APK, two modes).
          Families follow on the public page — no install.
        </p>
        <div className="actions">
          <Link className="button" to="/organise">
            {t('organise')}
          </Link>
          <Link className="button secondary" to="/control-room">
            {t('controlRoom')}
          </Link>
          <Link className="button secondary" to="/public">
            {t('publicBoard')}
          </Link>
          <Link className="button secondary" to="/auth">
            {t('auth')}
          </Link>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>Android app</h2>
          <p className="muted">
            <strong>Rider:</strong> join code → battery checklist → track.
            <br />
            <strong>Volunteer:</strong> desk confirm/undo + live risk list.
          </p>
          <p className="muted">
            Demo join code: <strong>{event?.joinCode ?? 'BRM200'}</strong>
          </p>
        </div>
        <div className="panel">
          <h2>This website</h2>
          <p className="muted">
            Clubs/admins: event wizard, GPX, ACP times, entries, HQ map, results
            CSV. Public delayed board for followers.
          </p>
        </div>
      </section>

      {event && (
        <section className="panel">
          <h2>Current demo event</h2>
          <p className="muted">
            {event.clubName} · {event.name}
          </p>
          <div className="stat-row">
            <div className="stat">
              <strong>{event.distanceKm} km</strong>
              Distance
            </div>
            <div className="stat">
              <strong>{event.entries.length}</strong>
              Entries
            </div>
            <div className="stat">
              <strong>{event.controls.length}</strong>
              Controls
            </div>
            <div className="stat">
              <strong>{event.status}</strong>
              Status
            </div>
          </div>
        </section>
      )}

      <p className="muted">{t('sosDisclaimer')}</p>
    </div>
  )
}
