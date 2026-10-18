import { useEffect, useMemo, useState } from 'react'
import { getEvent, resultsCsv } from '../lib/api'
import type { EventRecord } from '../lib/types'
import { EventMap } from '../components/EventMap'

export function ResultsPage() {
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [replayIdx, setReplayIdx] = useState(0)

  useEffect(() => {
    void getEvent().then(setEvent)
  }, [])

  const finishControl = event?.controls[event.controls.length - 1]
  const rows = useMemo(() => {
    if (!event || !finishControl) return []
    return event.entries.map((e) => {
      const fin = event.checkins.find(
        (c) =>
          c.entryId === e.id && c.controlId === finishControl.id && !c.undoneAt,
      )
      return { entry: e, finishAt: fin?.checkedAt }
    })
  }, [event, finishControl])

  const replayRiders = useMemo(() => {
    if (!event) return []
    // Simple replay stub: show riders that have lastSeen, offset by slider
    return event.entries
      .filter((e) => e.lastLat != null)
      .map((e, i) => ({
        ...e,
        lastLat: e.lastLat! + (replayIdx - i) * 0.0005,
        lastLng: e.lastLng!,
      }))
  }, [event, replayIdx])

  if (!event) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <section>
        <h1>Results</h1>
        <p className="lead">
          Homologation-style export and a simple post-event replay stub.
        </p>
      </section>

      <section className="panel stack">
        <h2>Finish list</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bib</th>
                <th>Nickname</th>
                <th>Wave</th>
                <th>Status</th>
                <th>Finish</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, finishAt }) => (
                <tr key={entry.id}>
                  <td>{entry.bib}</td>
                  <td>{entry.nickname}</td>
                  <td>{entry.wave ?? '—'}</td>
                  <td>{entry.status}</td>
                  <td>
                    {finishAt
                      ? new Date(finishAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => {
            const csv = resultsCsv(event)
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${event.joinCode}-results.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Download CSV (homologation-style)
        </button>
      </section>

      <section className="panel stack">
        <h2>Replay (stub)</h2>
        <label>
          Scrub
          <input
            type="range"
            min={0}
            max={20}
            value={replayIdx}
            onChange={(e) => setReplayIdx(Number(e.target.value))}
          />
        </label>
        <EventMap controls={event.controls} riders={replayRiders} height={280} />
      </section>
    </div>
  )
}
