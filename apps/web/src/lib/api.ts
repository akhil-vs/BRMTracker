/**
 * Data API: Supabase when configured, otherwise enhanced local demo store.
 */
import { store } from './store'
import { supabase, usingDemoStore } from './supabase'
import type { AuthUser, Entry, EventRecord, Visibility } from './types'
import { buildPublicSnapshot } from './snapshot'

export { usingDemoStore }

export async function getEvent(): Promise<EventRecord> {
  if (!supabase) return store.getEvent()

  // Minimal remote path: load first live/published event for the signed-in club.
  // Full multi-event UI can expand later; demo store covers local pilot UX.
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['draft', 'published', 'live', 'finished'])
    .order('start_at', { ascending: false })
    .limit(1)

  if (error || !events?.length) return store.getEvent()

  const ev = events[0]
  const [{ data: controls }, { data: entries }, { data: checkins }, { data: alerts }] =
    await Promise.all([
      supabase.from('controls').select('*').eq('event_id', ev.id).order('seq'),
      supabase.from('entries').select('*').eq('event_id', ev.id),
      supabase.from('checkins').select('*'),
      supabase.from('alerts').select('*').eq('active', true),
    ])

  return {
    id: ev.id,
    clubId: ev.club_id,
    clubName: 'Club',
    name: ev.name,
    distanceKm: ev.distance_km,
    startAt: ev.start_at,
    status: ev.status,
    joinCode: ev.join_code,
    publicDelayMinutes: ev.public_delay_minutes,
    trimStartKm: Number(ev.trim_start_km ?? 2),
    trimFinishKm: Number(ev.trim_finish_km ?? 2),
    gpxText: ev.gpx_text ?? undefined,
    controls: (controls ?? []).map((c) => ({
      id: c.id,
      seq: c.seq,
      name: c.name,
      km: Number(c.km),
      lat: c.lat ?? undefined,
      lng: c.lng ?? undefined,
      openAt: c.open_at,
      closeAt: c.close_at,
      openOverride: c.open_override,
      closeOverride: c.close_override,
    })),
    entries: (entries ?? []).map((e) => ({
      id: e.id,
      nickname: e.nickname,
      bib: e.bib ?? '',
      emergencyContact: e.emergency_contact ?? '',
      consentTracking: e.consent_tracking,
      visibility: e.visibility,
      status: e.status,
      wave: e.wave ?? undefined,
      deviceId: e.device_id ?? undefined,
    })),
    checkins: (checkins ?? [])
      .filter((c) => (entries ?? []).some((e) => e.id === c.entry_id))
      .map((c) => ({
        id: c.id,
        entryId: c.entry_id,
        controlId: c.control_id,
        checkedAt: c.checked_at,
        source: c.source,
        confirmedBy: c.confirmed_by ?? 'staff',
        late: c.late,
        undoneAt: c.undone_at ?? undefined,
      })),
    alerts: (alerts ?? []).map((a) => ({
      id: a.id,
      entryId: a.entry_id,
      type: a.type,
      message: a.message ?? undefined,
      active: a.active,
      createdAt: a.created_at,
    })),
  }
}

export async function saveEventMeta(
  patch: Partial<EventRecord>,
): Promise<EventRecord> {
  if (!supabase) return store.updateEvent(patch)
  // Prefer demo enrichment path until full remote write UI is expanded
  return store.updateEvent(patch)
}

export async function resetDemo(): Promise<EventRecord> {
  return store.resetDemo()
}

export async function setControlsFromPoints(
  distanceKm: number,
  startAtIso: string,
  points?: { name: string; km: number; lat?: number; lng?: number }[],
): Promise<EventRecord> {
  return store.setControlsFromPoints(distanceKm, startAtIso, points)
}

export async function overrideControl(
  controlId: string,
  patch: Parameters<typeof store.overrideControl>[1],
): Promise<EventRecord> {
  return store.overrideControl(controlId, patch)
}

export async function addEntry(
  input: Parameters<typeof store.addEntry>[0],
): Promise<EventRecord> {
  return store.addEntry(input)
}

export async function confirmCheckin(
  entryId: string,
  controlId: string,
  volunteerName: string,
): Promise<EventRecord> {
  if (supabase) {
    await supabase.rpc('confirm_checkin', {
      p_entry_id: entryId,
      p_control_id: controlId,
      p_volunteer_name: volunteerName,
    })
    return getEvent()
  }
  return store.confirmCheckin(entryId, controlId, volunteerName)
}

export async function undoCheckin(checkinId: string): Promise<EventRecord> {
  return store.undoCheckin(checkinId)
}

export async function raiseSos(entryId: string, message?: string) {
  return store.raiseSos(entryId, message)
}

export async function resolveAlert(alertId: string) {
  return store.resolveAlert(alertId)
}

export async function joinByCode(input: {
  joinCode: string
  nickname: string
  deviceId: string
  visibility: Visibility
  emergencyContact?: string
}): Promise<{ event: EventRecord; entry: Entry }> {
  if (supabase) {
    const { data, error } = await supabase.rpc('join_event', {
      p_join_code: input.joinCode,
      p_nickname: input.nickname,
      p_device_id: input.deviceId,
      p_consent_tracking: true,
      p_consent_public: input.visibility === 'public',
      p_visibility: input.visibility,
      p_emergency_contact: input.emergencyContact ?? null,
    })
    if (error) throw error
    const event = await getEvent()
    return { event, entry: data as Entry }
  }
  return store.joinByCode(input)
}

export function publicSnapshot(event?: EventRecord) {
  return buildPublicSnapshot(event ?? store.getEvent())
}

export function resultsCsv(event?: EventRecord) {
  return store.resultsCsv(event)
}

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!supabase) {
    const raw = localStorage.getItem('brmtracker.demo.user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  }
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    displayName:
      (data.user.user_metadata?.display_name as string) ||
      data.user.email?.split('@')[0] ||
      'Organiser',
  }
}

export async function signInDemo(email: string, displayName: string) {
  const user: AuthUser = {
    id: 'demo-user',
    email,
    displayName,
  }
  localStorage.setItem('brmtracker.demo.user', JSON.stringify(user))
  return user
}

export async function signOut() {
  localStorage.removeItem('brmtracker.demo.user')
  if (supabase) await supabase.auth.signOut()
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return signInDemo(email, email.split('@')[0] || 'Organiser')
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return {
    id: data.user!.id,
    email: data.user!.email!,
    displayName: data.user!.email!.split('@')[0],
  } satisfies AuthUser
}
