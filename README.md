# BRM Tracker

Free platform for Indian randonneuring clubs.

## Client split (app-first)

| Client | Audience | Purpose |
| --- | --- | --- |
| **Android app** (`apps/rider`) | Riders + volunteers | Join/track/SOS; field control desk + live alerts |
| **Admin web** (`apps/web`) | Club admins / HQ | Event wizard, GPX, ACP calculator, HQ control room, results |
| **Public web** | Family/friends | Delayed map + follow (no install) |

Backend: **Supabase** (`supabase/migrations`). Without env vars, web + app use local demo data (join code **BRM200**).

## Quick start — admin web

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173 — Events, HQ room, Public, Results, Sign in.

## Quick start — Android app

```bash
cd apps/rider
flutter pub get
flutter run
```

1. Pick **I am a rider** or **I am a volunteer**
2. Sign in (demo: `rider@club.example` / `volunteer@club.example`, password `demo-password`)
3. Rider: join **BRM200** → battery checklist → Start tracking
4. Volunteer: Desk tab to confirm; Live tab for risk/SOS

Admin web sign-in: `admin@club.example` / `demo-password`. See [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md).

## Docs

- [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)
- [docs/OPS.md](docs/OPS.md)

## Architecture

```
Rider/Volunteer APK ──► Supabase ◄── Admin web
                              │
                              └── live.json snapshot ──► Public web
```
