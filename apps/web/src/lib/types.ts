export type EntryStatus =
  | 'registered'
  | 'started'
  | 'finished'
  | 'abandoned'
  | 'dnf'

export type Visibility = 'public' | 'followers' | 'organiser'

export type AlertType = 'stopped' | 'cutoff_risk' | 'sos'

export interface Control {
  id: string
  seq: number
  name: string
  km: number
  lat?: number
  lng?: number
  openAt: string
  closeAt: string
  openOverride: boolean
  closeOverride: boolean
}

export interface Entry {
  id: string
  nickname: string
  bib: string
  emergencyContact: string
  consentTracking: boolean
  visibility: Visibility
  status: EntryStatus
  wave?: string
  startOffsetMinutes?: number
  deviceId?: string
  lastLat?: number
  lastLng?: number
  lastSeenAt?: string
  batteryPct?: number
  timeInHandMinutes?: number
}

export interface Checkin {
  id: string
  entryId: string
  controlId: string
  checkedAt: string
  source: 'auto' | 'volunteer' | 'manual'
  confirmedBy: string
  late: boolean
  undoneAt?: string
}

export interface Alert {
  id: string
  entryId: string
  type: AlertType
  message?: string
  active: boolean
  createdAt: string
}

export interface EventRecord {
  id: string
  clubId?: string
  clubName: string
  name: string
  distanceKm: number
  startAt: string
  status: 'draft' | 'published' | 'live' | 'finished' | 'cancelled'
  joinCode: string
  publicDelayMinutes: number
  trimStartKm: number
  trimFinishKm: number
  gpxText?: string
  controls: Control[]
  entries: Entry[]
  checkins: Checkin[]
  alerts: Alert[]
}

export type UserRole = 'owner' | 'admin' | 'volunteer' | 'rider' | 'member'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  clubId?: string
  clubName?: string
}
