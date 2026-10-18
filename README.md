# BRM Tracker

Free platform for Indian randonneuring clubs to run brevets, track riders with almost no rider effort, and let the public follow along.

## Product plan & ops

- **[docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)** — vision, roadmap, risks
- **[docs/OPS.md](docs/OPS.md)** — pilot runbook (Supabase, desk, APK, retention)

## Stack

| Layer | Choice |
| --- | --- |
| Rider app | Flutter (Android first) — `apps/rider` |
| Organiser + public web | React + Vite + Leaflet/OSM — `apps/web` |
| Backend | Supabase (Postgres + Auth + Realtime) — `supabase/migrations` |
| Control times | `packages/acp-times` (+ Dart port) |
| Public scale | Snapshot JSON (`scripts/generate-snapshot.mjs` + `/public` UI) |

Without `VITE_SUPABASE_*`, the web app uses an enhanced **local demo store** (join code **BRM200**).

## Quick start — web

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173

Useful routes: Organise (wizard + GPX), Control room (map), Control desk, Public (delayed), Results (CSV), Privacy, Embed (`/embed`), Auth.

```bash
npm test
npm run build
```

## Quick start — rider (Android)

```bash
cd apps/rider
flutter pub get
flutter test
flutter run
```

Join with **BRM200**, complete the battery checklist, start tracking.

## What works in this build

- ACP calculator (tested)
- Organiser wizard, GPX import, entries/waves, go-live
- Live control room (OSM map, risk sort, SOS ack) + thumb-first desk
- Public delayed map, follow stub, embed widget, snapshot JSON
- Results CSV + replay stub; EN/HI i18n toggle
- Privacy/consent draft + retention SQL helper
- Rider: offline session, adaptive GPS queue, geofence auto check-in, time in hand, SOS/Abandon
- Supabase migrations + `join_event` / `upload_positions` / `confirm_checkin` / `raise_sos` RPCs

## Still for a real pilot

- Provision Supabase and point `.env` at it
- Long-ride tests on Xiaomi/Vivo/Oppo/Samsung with true FGS notification polish
- Wire rider uploads + desk to the same project end-to-end
- Legal review of consent copy (DPDP)
