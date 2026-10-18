import { controlTimes } from '@brmtracker/acp-times'
import type { Alert, Checkin, Control, Entry, EventRecord } from './types'
import { computeTimeInHand, deriveAlerts, nextControlForEntry } from './timeInHand'

const STORAGE_KEY = 'brmtracker.demo.v2'

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function joinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function defaultControls(
  distanceKm: number,
  startAt: Date,
  points?: { name: string; km: number; lat?: number; lng?: number }[],
): Omit<Control, 'id'>[] {
  const waypoints =
    points ??
    (() => {
      const w: { name: string; km: number }[] = [{ name: 'Start', km: 0 }]
      if (distanceKm >= 200) {
        w.push({ name: 'Control 1', km: Math.round(distanceKm * 0.3) })
        w.push({ name: 'Control 2', km: Math.round(distanceKm * 0.6) })
      }
      if (distanceKm >= 400) {
        w.push({ name: 'Control 3', km: Math.round(distanceKm * 0.8) })
      }
      w.push({ name: 'Finish', km: distanceKm })
      return w
    })()

  return waypoints.map((w, seq) => {
    const times = controlTimes(startAt, w.km, distanceKm, {
      isFinish: seq === waypoints.length - 1,
    })
    const withCoords = w as { name: string; km: number; lat?: number; lng?: number }
    return {
      seq,
      name: withCoords.name,
      km: withCoords.km,
      lat: withCoords.lat,
      lng: withCoords.lng,
      openAt: times.openAt.toISOString(),
      closeAt: times.closeAt.toISOString(),
      openOverride: false,
      closeOverride: false,
    }
  })
}

function enrich(event: EventRecord): EventRecord {
  const entries = event.entries.map((e) => {
    const next = nextControlForEntry(event.controls, event.checkins, e.id)
    const tih = computeTimeInHand(e, next)
    return { ...e, timeInHandMinutes: tih }
  })

  const derived: Alert[] = []
  for (const e of entries) {
    for (const a of deriveAlerts(e, e.timeInHandMinutes)) {
      if (a.type === 'sos') continue
      derived.push({
        id: uid('alrt'),
        entryId: e.id,
        type: a.type,
        message: a.message,
        active: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const sos = (event.alerts ?? []).filter((a) => a.type === 'sos' && a.active)
  return { ...event, entries, alerts: [...sos, ...derived] }
}

function seedEvent(): EventRecord {
  const startAt = new Date()
  startAt.setHours(6, 0, 0, 0)
  if (startAt.getTime() < Date.now()) startAt.setDate(startAt.getDate() + 1)

  const distanceKm = 200
  const controls: Control[] = defaultControls(distanceKm, startAt).map((c) => ({
    ...c,
    id: uid('ctl'),
    lat: 12.97 + c.km * 0.001,
    lng: 77.59 + c.km * 0.0015,
  }))

  const entries: Entry[] = [
    {
      id: uid('ent'),
      nickname: 'Ghat Hopper',
      bib: '101',
      emergencyContact: '+91 90000 00001',
      consentTracking: true,
      visibility: 'public',
      status: 'started',
      lastLat: 12.98,
      lastLng: 77.6,
      lastSeenAt: new Date(Date.now() - 8 * 60_000).toISOString(),
      batteryPct: 72,
      wave: 'A',
    },
    {
      id: uid('ent'),
      nickname: 'Dawn Rider',
      bib: '102',
      emergencyContact: '+91 90000 00002',
      consentTracking: true,
      visibility: 'public',
      status: 'started',
      lastLat: 12.99,
      lastLng: 77.62,
      lastSeenAt: new Date(Date.now() - 18 * 60_000).toISOString(),
      batteryPct: 40,
      wave: 'A',
    },
    {
      id: uid('ent'),
      nickname: 'Private Pilot',
      bib: '103',
      emergencyContact: '+91 90000 00003',
      consentTracking: true,
      visibility: 'organiser',
      status: 'registered',
      wave: 'B',
      startOffsetMinutes: 15,
    },
  ]

  return enrich({
    id: uid('evt'),
    clubName: 'Demo Randonneurs Bangalore',
    name: 'BRM 200 — Demo',
    distanceKm,
    startAt: startAt.toISOString(),
    status: 'live',
    joinCode: 'BRM200',
    publicDelayMinutes: 15,
    trimStartKm: 2,
    trimFinishKm: 2,
    controls,
    entries,
    checkins: [],
    alerts: [],
  })
}

function loadRaw(): EventRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as EventRecord
  } catch {
    /* ignore */
  }
  // migrate from v1
  try {
    const v1 = localStorage.getItem('brmtracker.demo.v1')
    if (v1) {
      const parsed = JSON.parse(v1) as EventRecord
      const migrated: EventRecord = {
        ...parsed,
        trimStartKm: parsed.trimStartKm ?? 2,
        trimFinishKm: parsed.trimFinishKm ?? 2,
        alerts: parsed.alerts ?? [],
        joinCode: parsed.joinCode || 'BRM200',
      }
      save(migrated)
      return migrated
    }
  } catch {
    /* ignore */
  }
  const seeded = seedEvent()
  save(seeded)
  return seeded
}

function save(event: EventRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(event))
}

export const store = {
  getEvent(): EventRecord {
    return enrich(loadRaw())
  },

  resetDemo(): EventRecord {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('brmtracker.demo.v1')
    return store.getEvent()
  },

  updateEvent(patch: Partial<EventRecord>): EventRecord {
    const event = enrich({ ...loadRaw(), ...patch })
    save(event)
    return event
  },

  setControlsFromPoints(
    distanceKm: number,
    startAtIso: string,
    points?: { name: string; km: number; lat?: number; lng?: number }[],
  ): EventRecord {
    const startAt = new Date(startAtIso)
    const controls = defaultControls(distanceKm, startAt, points).map(
      (c) =>
        ({
          ...c,
          id: uid('ctl'),
          lat: c.lat ?? 12.97 + c.km * 0.001,
          lng: c.lng ?? 77.59 + c.km * 0.0015,
        }) satisfies Control,
    )
    return store.updateEvent({ distanceKm, startAt: startAtIso, controls })
  },

  overrideControl(
    controlId: string,
    patch: Partial<Pick<Control, 'openAt' | 'closeAt' | 'name' | 'lat' | 'lng'>>,
  ): EventRecord {
    const event = loadRaw()
    event.controls = event.controls.map((c) => {
      if (c.id !== controlId) return c
      return {
        ...c,
        ...patch,
        openOverride: patch.openAt !== undefined ? true : c.openOverride,
        closeOverride: patch.closeAt !== undefined ? true : c.closeOverride,
      }
    })
    save(event)
    return enrich(event)
  },

  addEntry(input: {
    nickname: string
    bib: string
    emergencyContact: string
    visibility: Entry['visibility']
    wave?: string
  }): EventRecord {
    const event = loadRaw()
    event.entries.push({
      id: uid('ent'),
      nickname: input.nickname,
      bib: input.bib,
      emergencyContact: input.emergencyContact,
      consentTracking: true,
      visibility: input.visibility,
      status: 'registered',
      wave: input.wave,
    })
    save(event)
    return enrich(event)
  },

  joinByCode(input: {
    joinCode: string
    nickname: string
    deviceId: string
    visibility: Entry['visibility']
    emergencyContact?: string
  }): { event: EventRecord; entry: Entry } {
    const event = loadRaw()
    if (event.joinCode.toUpperCase() !== input.joinCode.toUpperCase()) {
      throw new Error('Invalid join code')
    }
    let entry = event.entries.find((e) => e.deviceId === input.deviceId)
    if (entry) {
      entry.nickname = input.nickname
      entry.visibility = input.visibility
    } else {
      entry = {
        id: uid('ent'),
        nickname: input.nickname,
        bib: String(100 + event.entries.length),
        emergencyContact: input.emergencyContact ?? '',
        consentTracking: true,
        visibility: input.visibility,
        status: 'registered',
        deviceId: input.deviceId,
      }
      event.entries.push(entry)
    }
    save(event)
    return { event: enrich(event), entry }
  },

  confirmCheckin(
    entryId: string,
    controlId: string,
    volunteerName: string,
  ): EventRecord {
    const event = loadRaw()
    const control = event.controls.find((c) => c.id === controlId)
    const entry = event.entries.find((e) => e.id === entryId)
    if (!control || !entry) return enrich(event)

    const checkedAt = new Date()
    const late = checkedAt.getTime() > new Date(control.closeAt).getTime()

    event.checkins = event.checkins.map((c) =>
      c.entryId === entryId && c.controlId === controlId && !c.undoneAt
        ? { ...c, undoneAt: checkedAt.toISOString() }
        : c,
    )

    const checkin: Checkin = {
      id: uid('chk'),
      entryId,
      controlId,
      checkedAt: checkedAt.toISOString(),
      source: 'volunteer',
      confirmedBy: volunteerName,
      late,
    }
    event.checkins.push(checkin)

    entry.lastLat = control.lat
    entry.lastLng = control.lng
    entry.lastSeenAt = checkedAt.toISOString()
    entry.status =
      control.seq === event.controls.length - 1 ? 'finished' : 'started'

    save(event)
    return enrich(event)
  },

  undoCheckin(checkinId: string): EventRecord {
    const event = loadRaw()
    event.checkins = event.checkins.map((c) =>
      c.id === checkinId ? { ...c, undoneAt: new Date().toISOString() } : c,
    )
    save(event)
    return enrich(event)
  },

  raiseSos(entryId: string, message = 'SOS'): EventRecord {
    const event = loadRaw()
    event.alerts = event.alerts ?? []
    event.alerts.push({
      id: uid('alrt'),
      entryId,
      type: 'sos',
      message,
      active: true,
      createdAt: new Date().toISOString(),
    })
    save(event)
    return enrich(event)
  },

  resolveAlert(alertId: string): EventRecord {
    const event = loadRaw()
    event.alerts = (event.alerts ?? []).map((a) =>
      a.id === alertId ? { ...a, active: false } : a,
    )
    save(event)
    return enrich(event)
  },

  uploadPositions(
    entryId: string,
    points: { recordedAt: string; lat: number; lng: number; batteryPct?: number }[],
  ): EventRecord {
    const event = loadRaw()
    const entry = event.entries.find((e) => e.id === entryId)
    if (!entry || points.length === 0) return enrich(event)
    const last = points[points.length - 1]
    entry.lastLat = last.lat
    entry.lastLng = last.lng
    entry.lastSeenAt = last.recordedAt
    entry.batteryPct = last.batteryPct
    if (entry.status === 'registered') entry.status = 'started'
    save(event)
    return enrich(event)
  },

  abandon(entryId: string): EventRecord {
    const event = loadRaw()
    event.entries = event.entries.map((e) =>
      e.id === entryId ? { ...e, status: 'abandoned' as const } : e,
    )
    save(event)
    return enrich(event)
  },

  resultsCsv(event: EventRecord = store.getEvent()): string {
    const header = 'bib,nickname,status,finish_time,wave'
    const finishId = event.controls[event.controls.length - 1]?.id
    const rows = event.entries.map((e) => {
      const fin = event.checkins.find(
        (c) => c.entryId === e.id && c.controlId === finishId && !c.undoneAt,
      )
      return [
        e.bib,
        JSON.stringify(e.nickname),
        e.status,
        fin?.checkedAt ?? '',
        e.wave ?? '',
      ].join(',')
    })
    return [header, ...rows].join('\n')
  },
}

// keep joinCode helper available for tests
export { joinCode as generateJoinCode }
