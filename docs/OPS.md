# BRM Tracker — ops runbook (pilot)

## Before the event

1. Create a Supabase project (free tier). Apply migrations in order:
   - `supabase/migrations/20260318000000_init.sql`
   - `supabase/migrations/20260318120000_phase_a_rpc.sql`
2. Copy `apps/web/.env.example` → `apps/web/.env` with URL + anon key.
3. Sign in as organiser (`/auth`), create club via SQL or RPC `create_club_with_owner`.
4. Organise wizard: event → GPX/controls → entries → **live**.
5. Note join code. Build release APK: `cd apps/rider && flutter build apk`.
6. Share **one APK** with riders and volunteers + join code.
7. Riders: open app → **I am a rider** → join → battery checklist.
8. Volunteers: open app → **I am a volunteer** → Desk / Live tabs.

## Event day

- **Field desk:** volunteers use the **Android app** (Volunteer → Desk). Search bib → Confirm. Undo if wrong.
- **HQ control room:** admins use `/control-room` on a laptop — no public delay. Watch SOS and cutoff-risk.
- **HQ desk fallback:** `/control-desk` only if a laptop is at the control.
- **Public:** `/public` (delayed). Optional: run snapshot script every 60s and host `live.json` on Cloudflare R2/Pages so viewers do not hit Supabase.

```bash
# From apps/web after building a node helper, or paste snapshot JSON from Public page details.
node ../../scripts/generate-snapshot.mjs
```

## After the event

- Set status **finished**.
- Download results CSV from `/results`.
- Run retention: `select purge_old_positions(30);` in Supabase SQL.
- Honour deletion requests via club process (Privacy page).

## Recovering desk offline

If the network dies at a control, volunteers can note bib + time on paper, then Confirm when back online (or use a tablet that cached the page — prefer paper backup for homologation).

## Rider tracking failures

Usually battery optimisation. Re-check Xiaomi/Vivo/Oppo/Samsung unrestricted battery + autostart. Dead zones should show **last seen**, not lost.
