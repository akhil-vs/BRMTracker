import { useMemo, useState } from 'react'
import {
  controlTimes,
  formatClock,
  formatDuration,
  nearestBrevetDistance,
  OVERALL_LIMIT_MINUTES,
} from '@brmtracker/acp-times'

export function CalculatorPage() {
  const [distance, setDistance] = useState(200)
  const [startLocal, setStartLocal] = useState(() => {
    const d = new Date()
    d.setHours(6, 0, 0, 0)
    return toLocalInput(d)
  })
  const [kmList, setKmList] = useState('0, 60, 120, 175, 200')

  const rows = useMemo(() => {
    const startAt = new Date(startLocal)
    const kms = kmList
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n >= 0)
    return kms.map((km, i) => {
      const isFinish = i === kms.length - 1 || km >= distance - 0.5
      const t = controlTimes(startAt, km, distance, { isFinish })
      return { km, ...t, isFinish }
    }).concat([])
  }, [distance, startLocal, kmList])

  const brevet = nearestBrevetDistance(distance)
  const overall = OVERALL_LIMIT_MINUTES[brevet]

  return (
    <div className="stack">
      <section>
        <h1>ACP control calculator</h1>
        <p className="lead">
          Opening and closing times follow the ACP règlement (French variation for the
          first 60 km). Finish closing is capped by the overall brevet limit.
        </p>
      </section>

      <section className="panel grid two">
        <label>
          Brevet distance (km)
          <select
            value={distance}
            onChange={(e) => {
              const d = Number(e.target.value)
              setDistance(d)
              setKmList(`0, ${Math.round(d * 0.3)}, ${Math.round(d * 0.6)}, ${d}`)
            }}
          >
            {[200, 300, 400, 600, 1000].map((d) => (
              <option key={d} value={d}>
                {d} km
              </option>
            ))}
          </select>
        </label>
        <label>
          Start time
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Control distances (km, comma-separated)
          <input value={kmList} onChange={(e) => setKmList(e.target.value)} />
        </label>
      </section>

      <section className="panel">
        <p className="muted">
          Matched brevet class: <strong>{brevet} km</strong> · overall limit{' '}
          <strong>{formatDuration(overall)}</strong>
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>km</th>
                <th>Open (elapsed)</th>
                <th>Open clock</th>
                <th>Close (elapsed)</th>
                <th>Close clock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.km}-${r.openMinutesFromStart}`}>
                  <td>
                    {r.km}
                    {r.isFinish ? ' (finish)' : ''}
                  </td>
                  <td>{formatDuration(r.openMinutesFromStart)}</td>
                  <td>{formatClock(r.openAt)}</td>
                  <td>{formatDuration(r.closeMinutesFromStart)}</td>
                  <td>{formatClock(r.closeAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
