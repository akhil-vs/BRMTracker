import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvent } from '../lib/api'
import { useAuth } from '../lib/authContext'
import type { EventRecord } from '../lib/types'
import { useI18n } from '../lib/i18n'

export function HomePage() {
  const { t } = useI18n()
  const { user, canAccessAdmin, canAccessHq } = useAuth()
  const [event, setEvent] = useState<EventRecord | null>(null)

  useEffect(() => {
    void getEvent().then(setEvent)
  }, [])

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-brand">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">India · Audax · ACP</p>
          <h1 id="hero-brand">BRM Tracker</h1>
          <p className="hero-lead">
            Free brevet ops for clubs — riders track with almost no effort, volunteers
            confirm at controls, families follow on a delayed public board.
          </p>
          <div className="actions hero-actions">
            {user ? (
              <>
                {canAccessAdmin && (
                  <Link className="button" to="/organise">
                    {t('organise')}
                  </Link>
                )}
                {canAccessHq && (
                  <Link className="button secondary" to="/control-room">
                    {t('controlRoom')}
                  </Link>
                )}
                <Link className="button secondary" to="/public">
                  {t('publicBoard')}
                </Link>
              </>
            ) : (
              <>
                <Link className="button" to="/auth">
                  {t('auth')}
                </Link>
                <Link className="button secondary" to="/public">
                  Follow live
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {user && (
        <section className="signed-in-strip">
          <p>
            Signed in as <strong>{user.displayName}</strong>
            <span className="muted"> · {user.role}</span>
            {user.clubName ? (
              <span className="muted"> · {user.clubName}</span>
            ) : null}
          </p>
        </section>
      )}

      <section className="split-section" aria-labelledby="split-heading">
        <h2 id="split-heading">Where each person works</h2>
        <p className="lead section-lead">
          One Android APK for the road. This website for club HQ and public follow.
        </p>
        <div className="split-grid">
          <article>
            <h3>Android app</h3>
            <p className="muted">
              Riders sign in, join with a code, then ride. Volunteers sign in for
              desk confirm and live SOS. Demo code{' '}
              <strong>{event?.joinCode ?? 'BRM200'}</strong>.
            </p>
          </article>
          <article>
            <h3>Admin web</h3>
            <p className="muted">
              Club admins sign in here to set up events, import GPX, run the HQ
              room, and export results.
            </p>
          </article>
        </div>
      </section>

      {event && user && canAccessAdmin && (
        <section className="event-section" aria-labelledby="event-heading">
          <h2 id="event-heading">Current demo event</h2>
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

      <p className="muted footer-note">{t('sosDisclaimer')}</p>
    </div>
  )
}
