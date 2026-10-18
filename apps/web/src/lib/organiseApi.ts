/** Thin re-exports so OrganisePage does not import store internals. */
import { store } from './store'
import type { EventRecord } from './types'

export async function getEvent(): Promise<EventRecord> {
  return store.getEvent()
}

export async function updateEventViaStore(
  patch: Partial<EventRecord>,
): Promise<EventRecord> {
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
