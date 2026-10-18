/**
 * ACP / BRM control open & close times.
 * Based on Audax Club Parisien règlement (French variation for early controls),
 * also documented by RUSA.
 *
 * Opening (max speed, segmented):
 *   0–200: 34 km/h, 200–400: 32, 400–600: 30, 600–1000: 28
 *
 * Closing (min speed, French variation for first 60 km):
 *   0–60: 1 hour + distance/20 km/h
 *   60–600: 15 km/h
 *   600–1000: 11.428 km/h
 *
 * Overall limits: 200→13h30, 300→20h, 400→27h, 600→40h, 1000→75h
 * Times rounded to the nearest minute (commercial rounding).
 */

export type BrevetDistance = 200 | 300 | 400 | 600 | 1000;

export const OVERALL_LIMIT_MINUTES: Record<BrevetDistance, number> = {
  200: 13 * 60 + 30,
  300: 20 * 60,
  400: 27 * 60,
  600: 40 * 60,
  1000: 75 * 60,
};

const OPEN_SEGMENTS: { untilKm: number; speed: number }[] = [
  { untilKm: 200, speed: 34 },
  { untilKm: 400, speed: 32 },
  { untilKm: 600, speed: 30 },
  { untilKm: 1000, speed: 28 },
];

/** Commercial round to nearest minute. */
export function roundMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * Elapsed hours to cover `distanceKm` at segmented max speeds (opening).
 */
export function openingElapsedHours(distanceKm: number): number {
  let remaining = Math.max(0, distanceKm);
  let prev = 0;
  let hours = 0;

  for (const seg of OPEN_SEGMENTS) {
    if (remaining <= 0) break;
    const span = Math.min(remaining, seg.untilKm - prev);
    hours += span / seg.speed;
    remaining -= span;
    prev = seg.untilKm;
  }

  if (remaining > 0) {
    hours += remaining / 28;
  }

  return hours;
}

/**
 * Elapsed hours to cover `distanceKm` at min speeds (closing), French variation.
 */
export function closingElapsedHours(distanceKm: number): number {
  const d = Math.max(0, distanceKm);

  if (d <= 60) {
    return 1 + d / 20;
  }

  // At 60 km: 1 + 60/20 = 4 hours (= 60/15)
  let hours = 4;
  const after60 = d - 60;

  if (d <= 600) {
    hours += after60 / 15;
    return hours;
  }

  // 60–600 at 15 km/h
  hours += (600 - 60) / 15;
  const after600 = d - 600;
  hours += after600 / 11.428;
  return hours;
}

export function nearestBrevetDistance(distanceKm: number): BrevetDistance {
  const options: BrevetDistance[] = [200, 300, 400, 600, 1000];
  let best: BrevetDistance = 200;
  let bestDiff = Math.abs(distanceKm - 200);
  for (const o of options) {
    const diff = Math.abs(distanceKm - o);
    if (diff < bestDiff) {
      best = o;
      bestDiff = diff;
    }
  }
  return best;
}

export interface ControlTimes {
  openMinutesFromStart: number;
  closeMinutesFromStart: number;
  openAt: Date;
  closeAt: Date;
}

/**
 * Compute open/close for a control at `controlKm` on a brevet of `brevetDistanceKm`.
 * Finish control closing is capped by the overall brevet limit.
 */
export function controlTimes(
  startAt: Date,
  controlKm: number,
  brevetDistanceKm: number,
  options?: { isFinish?: boolean },
): ControlTimes {
  const brevet = nearestBrevetDistance(brevetDistanceKm);
  const calcKm = Math.min(controlKm, brevet);

  let openMin = roundMinutes(openingElapsedHours(calcKm));
  let closeMin = roundMinutes(closingElapsedHours(calcKm));

  const overall = OVERALL_LIMIT_MINUTES[brevet];
  const isFinish =
    options?.isFinish === true ||
    controlKm >= brevetDistanceKm - 0.5 ||
    controlKm >= brevet - 0.5;

  if (isFinish) {
    closeMin = overall;
  } else {
    closeMin = Math.min(closeMin, overall);
  }

  // Start control (0 km): open at start, close +1h
  if (controlKm <= 0.01) {
    openMin = 0;
    closeMin = 60;
  }

  const openAt = new Date(startAt.getTime() + openMin * 60_000);
  const closeAt = new Date(startAt.getTime() + closeMin * 60_000);

  return {
    openMinutesFromStart: openMin,
    closeMinutesFromStart: closeMin,
    openAt,
    closeAt,
  };
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
