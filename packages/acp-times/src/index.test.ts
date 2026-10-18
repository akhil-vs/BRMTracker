import { describe, expect, it } from 'vitest';
import {
  closingElapsedHours,
  controlTimes,
  formatDuration,
  openingElapsedHours,
  roundMinutes,
} from './index';

describe('ACP opening times (RUSA 200km examples)', () => {
  it('matches 60 / 34 ≈ 1h46', () => {
    expect(roundMinutes(openingElapsedHours(60))).toBe(106);
    expect(formatDuration(106)).toBe('1h46');
  });

  it('matches 120 / 34 ≈ 3h32', () => {
    expect(roundMinutes(openingElapsedHours(120))).toBe(212);
    expect(formatDuration(212)).toBe('3h32');
  });

  it('matches 175 / 34 ≈ 5h09', () => {
    expect(roundMinutes(openingElapsedHours(175))).toBe(309);
    expect(formatDuration(309)).toBe('5h09');
  });
});

describe('ACP closing times (French variation)', () => {
  it('0 km closes at 1h', () => {
    expect(roundMinutes(closingElapsedHours(0))).toBe(60);
  });

  it('60 km closes at 4h', () => {
    expect(roundMinutes(closingElapsedHours(60))).toBe(240);
  });

  it('120 km closes at 8h', () => {
    expect(roundMinutes(closingElapsedHours(120))).toBe(480);
  });

  it('175 km closes at 11h40', () => {
    expect(roundMinutes(closingElapsedHours(175))).toBe(700);
  });
});

describe('controlTimes finish cap', () => {
  it('200km finish closes at 13h30', () => {
    const start = new Date('2026-01-01T06:00:00');
    const t = controlTimes(start, 200, 200, { isFinish: true });
    expect(t.closeMinutesFromStart).toBe(13 * 60 + 30);
  });

  it('start control opens at 0 and closes at 1h', () => {
    const start = new Date('2026-01-01T06:00:00');
    const t = controlTimes(start, 0, 200);
    expect(t.openMinutesFromStart).toBe(0);
    expect(t.closeMinutesFromStart).toBe(60);
  });
});
