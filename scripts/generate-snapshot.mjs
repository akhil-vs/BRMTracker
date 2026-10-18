#!/usr/bin/env node
/**
 * Writes a public live.json snapshot.
 * In demo/CI without a browser store, emits a static placeholder shape.
 * Wire to Supabase + R2 upload for production cron.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../apps/web/public/snapshots')
mkdirSync(outDir, { recursive: true })

const snapshot = {
  generatedAt: new Date().toISOString(),
  event: {
    id: 'demo',
    name: 'BRM 200 — Demo',
    clubName: 'Demo Randonneurs Bangalore',
    distanceKm: 200,
    status: 'live',
    publicDelayMinutes: 15,
  },
  riders: [],
  note: 'Replace by reading Supabase + buildPublicSnapshot in a scheduled function.',
}

const path = join(outDir, 'live.json')
writeFileSync(path, JSON.stringify(snapshot, null, 2))
console.log('Wrote', path)
