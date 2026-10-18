/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest'
import { parseGpx } from './gpx'

const sample = `<?xml version="1.0"?>
<gpx>
  <wpt lat="12.97" lon="77.59"><name>Start</name></wpt>
  <wpt lat="13.00" lon="77.65"><name>CP1</name></wpt>
  <wpt lat="13.05" lon="77.70"><name>Finish</name></wpt>
  <trk><trkseg>
    <trkpt lat="12.97" lon="77.59"></trkpt>
    <trkpt lat="13.00" lon="77.65"></trkpt>
    <trkpt lat="13.05" lon="77.70"></trkpt>
  </trkseg></trk>
</gpx>`

describe('parseGpx', () => {
  it('proposes controls from waypoints', () => {
    const r = parseGpx(sample)
    expect(r.track.length).toBe(3)
    expect(r.proposedControls.length).toBeGreaterThanOrEqual(2)
    expect(r.totalKm).toBeGreaterThan(0)
  })
})
