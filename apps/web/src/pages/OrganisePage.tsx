import { useEffect, useState } from 'react'
import { formatClock, formatDuration } from '@brmtracker/acp-times'
import {
  addEntry,
  getEvent,
  overrideControl,
  resetDemo,
  setControlsFromPoints,
  updateEventViaStore,
} from '../lib/organiseApi'
import { parseGpx } from '../lib/gpx'
import type { EventRecord } from '../lib/types'

export function OrganisePage() {
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [nickname, setNickname] = useState('')
  const [bib, setBib] = useState('')
  const [emergency, setEmergency] = useState('')
  const [wave, setWave] = useState('A')
  const [name, setName] = useState('')
  const [distanceKm, setDistanceKm] = useState(200)
  const [startLocal, setStartLocal] = useState('')
  const [gpxNote, setGpxNote] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    void getEvent().then((ev) => {
      setEvent(ev)
      setName(ev.name)
      setDistanceKm(ev.distanceKm)
      setStartLocal(toLocalInput(new Date(ev.startAt)))
    })
  }, [])

  if (!event) {
    return <p className="muted">Loading event…</p>
  }

  return (
    <div className="stack">
      <section>
        <h1>Organise</h1>
        <p className="lead">
          Wizard: event → route/controls → entries → go live. ACP times fill in
          automatically; overrides are rare.
        </p>
        <div className="stat-row">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              className={step === s ? '' : 'secondary'}
              onClick={() => setStep(s)}
            >
              Step {s}
            </button>
          ))}
        </div>
      </section>

      {step === 1 && (
        <section className="panel stack">
          <h2>1. Event</h2>
          <div className="grid two">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Distance (km)
              <select
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
              >
                {[200, 300, 400, 600, 1000].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start
              <input
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </label>
            <label>
              Join code
              <input value={event.joinCode} readOnly />
            </label>
            <label>
              Public delay (minutes)
              <input
                type="number"
                value={event.publicDelayMinutes}
                onChange={(e) =>
                  void updateEventViaStore({
                    publicDelayMinutes: Number(e.target.value),
                  }).then(setEvent)
                }
              />
            </label>
            <label>
              Status
              <select
                value={event.status}
                onChange={(e) =>
                  void updateEventViaStore({
                    status: e.target.value as EventRecord['status'],
                  }).then(setEvent)
                }
              >
                {['draft', 'published', 'live', 'finished'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="actions">
            <button
              type="button"
              onClick={async () => {
                const startIso = new Date(startLocal || event.startAt).toISOString()
                await setControlsFromPoints(distanceKm, startIso)
                const saved = await updateEventViaStore({
                  name: name || event.name,
                  distanceKm,
                  startAt: startIso,
                })
                setEvent(saved)
                setStep(2)
              }}
            >
              Save &amp; continue
            </button>
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                const ev = await resetDemo()
                setName(ev.name)
                setDistanceKm(ev.distanceKm)
                setStartLocal(toLocalInput(new Date(ev.startAt)))
                setEvent(ev)
              }}
            >
              Reset demo
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="panel stack">
          <h2>2. Route &amp; controls</h2>
          <label>
            Import GPX
            <input
              type="file"
              accept=".gpx,application/gpx+xml,text/xml"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const text = await file.text()
                  const parsed = parseGpx(text)
                  const dist =
                    Math.round(parsed.totalKm / 50) * 50 || event.distanceKm
                  const next = await setControlsFromPoints(
                    dist,
                    event.startAt,
                    parsed.proposedControls,
                  )
                  await updateEventViaStore({
                    gpxText: text.slice(0, 200_000),
                    distanceKm: dist,
                  })
                  setGpxNote(
                    `Imported ${parsed.track.length} track points, ${parsed.proposedControls.length} controls (~${parsed.totalKm.toFixed(1)} km).`,
                  )
                  setDistanceKm(dist)
                  setEvent(next)
                } catch (err) {
                  setGpxNote(
                    err instanceof Error ? err.message : 'GPX parse failed',
                  )
                }
              }}
            />
          </label>
          {gpxNote && <p className="muted">{gpxNote}</p>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>km</th>
                  <th>Open</th>
                  <th>Close</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {event.controls.map((c) => (
                  <tr key={c.id}>
                    <td>{c.seq}</td>
                    <td>{c.name}</td>
                    <td>{c.km}</td>
                    <td>
                      {formatClock(new Date(c.openAt))}
                      {c.openOverride ? ' *' : ''}
                    </td>
                    <td>
                      {formatClock(new Date(c.closeAt))}
                      <div className="muted">
                        +
                        {formatDuration(
                          Math.round(
                            (new Date(c.closeAt).getTime() -
                              new Date(event.startAt).getTime()) /
                              60_000,
                          ),
                        )}
                        {c.closeOverride ? ' *' : ''}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary"
                        onClick={async () => {
                          const open = prompt('Open ISO', c.openAt)
                          const close = prompt('Close ISO', c.closeAt)
                          if (open == null && close == null) return
                          setEvent(
                            await overrideControl(c.id, {
                              ...(open
                                ? { openAt: new Date(open).toISOString() }
                                : {}),
                              ...(close
                                ? { closeAt: new Date(close).toISOString() }
                                : {}),
                            }),
                          )
                        }}
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setStep(3)}>
            Continue to entries
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="panel stack">
          <h2>3. Entries</h2>
          <div className="grid two">
            <label>
              Nickname
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>
            <label>
              Bib
              <input value={bib} onChange={(e) => setBib(e.target.value)} />
            </label>
            <label>
              Emergency contact
              <input value={emergency} onChange={(e) => setEmergency(e.target.value)} />
            </label>
            <label>
              Wave
              <input value={wave} onChange={(e) => setWave(e.target.value)} />
            </label>
          </div>
          <button
            type="button"
            disabled={!nickname.trim()}
            onClick={async () => {
              setEvent(
                await addEntry({
                  nickname: nickname.trim(),
                  bib: bib.trim() || String(event.entries.length + 100),
                  emergencyContact: emergency.trim(),
                  visibility: 'public',
                  wave,
                }),
              )
              setNickname('')
              setBib('')
              setEmergency('')
            }}
          >
            Add rider
          </button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bib</th>
                  <th>Nickname</th>
                  <th>Wave</th>
                  <th>Visibility</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {event.entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.bib}</td>
                    <td>{e.nickname}</td>
                    <td>{e.wave ?? '—'}</td>
                    <td>{e.visibility}</td>
                    <td>{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setStep(4)}>
            Continue
          </button>
        </section>
      )}

      {step === 4 && (
        <section className="panel stack">
          <h2>4. Go live</h2>
          <p>
            Join code for riders: <strong>{event.joinCode}</strong>
          </p>
          <p className="muted">
            Share APK + code. Volunteers use Control desk on their phones.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={async () => setEvent(await updateEventViaStore({ status: 'live' }))}
            >
              Set status: live
            </button>
            <a className="button secondary" href="/control-desk">
              Open control desk
            </a>
            <a className="button secondary" href="/public">
              Public board
            </a>
          </div>
        </section>
      )}
    </div>
  )
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
