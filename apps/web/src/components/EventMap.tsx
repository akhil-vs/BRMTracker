import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Control, Entry } from '../lib/types'

interface Props {
  controls: Control[]
  riders?: Entry[]
  height?: number
  delayed?: boolean
}

export function EventMap({
  controls,
  riders = [],
  height = 280,
  delayed = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current) return
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const withCoords = controls.filter((c) => c.lat != null && c.lng != null)
    const center: L.LatLngExpression =
      withCoords.length > 0
        ? [withCoords[0].lat!, withCoords[0].lng!]
        : [12.97, 77.59]

    const map = L.map(ref.current).setView(center, 11)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    const bounds: L.LatLngExpression[] = []

    for (const c of withCoords) {
      const m = L.circleMarker([c.lat!, c.lng!], {
        radius: 7,
        color: '#0b6e4f',
        fillColor: '#d8efe6',
        fillOpacity: 0.9,
      })
        .bindPopup(`<strong>${c.name}</strong><br/>${c.km} km`)
        .addTo(map)
      bounds.push([c.lat!, c.lng!])
      void m
    }

    for (const r of riders) {
      if (r.lastLat == null || r.lastLng == null) continue
      L.circleMarker([r.lastLat, r.lastLng], {
        radius: 6,
        color: delayed ? '#9a3412' : '#1d4ed8',
        fillColor: delayed ? '#ffedd5' : '#dbeafe',
        fillOpacity: 0.95,
      })
        .bindPopup(`#${r.bib} ${r.nickname}`)
        .addTo(map)
      bounds.push([r.lastLat, r.lastLng])
    }

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [controls, riders, delayed])

  return (
    <div
      ref={ref}
      style={{ height, width: '100%', borderRadius: '0.7rem' }}
      className="event-map"
    />
  )
}
