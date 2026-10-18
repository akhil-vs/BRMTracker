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
        <h1>BRM Tracker India</h1>
        <p className="lead">
          Free tools for Indian randonneuring clubs: ACP times, live ops, volunteer
          desk, join-and-forget Android tracking, and a delayed public board.
        </p>
        <div className="actions">
          <Link className="button" to="/organise">
            {t('organise')}
          </Link>
          <Link className="button secondary" to="/calculator">
            {t('calculator')}
          </Link>
          <Link className="button secondary" to="/public">
            {t('publicBoard')}
          </Link>
        </div>
      </section>

      {event && (
        <section className="panel">
          <h2>Demo event</h2>
          <p className="muted">
            {event.clubName} · {event.name} · join code{' '}
            <strong>{event.joinCode}</strong>
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
              <strong>{event.publicDelayMinutes}m</strong>
              Public delay
            </div>
          </div>
        </section>
      )}

      <section className="grid two">
        <div className="panel">
          <h2>For clubs</h2>
          <p className="muted">
            Wizard setup under 15 minutes, GPX import, ACP controls, desk confirm
            for no-signal riders, live risk board.
          </p>
        </div>
        <div className="panel">
          <h2>For riders</h2>
          <p className="muted">
            Join with <strong>{event?.joinCode ?? 'BRM200'}</strong>, consent once,
            battery checklist, then ride. Glance for time in hand only.
          </p>
        </div>
      </section>
      <p className="muted">{t('sosDisclaimer')}</p>
    </div>
  )
}
