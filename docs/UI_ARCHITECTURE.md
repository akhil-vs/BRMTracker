# BRM Tracker — UI architecture (web + Android)

Design system and information architecture for the **app-first** split: one Android APK (riders + volunteers), admin web (club HQ), public web (followers).

---

## 1. Audiences and surfaces

| Audience | Primary surface | Must sign in? | Core jobs |
| --- | --- | --- | --- |
| Club admin / owner | Admin web | Yes | Create event, GPX, entries, HQ room, results |
| Control volunteer | Android app (desk + live) | Yes | Confirm check-ins, ack SOS; web desk is laptop fallback |
| Rider | Android app | Yes (account) then join code | Consent, battery checklist, track, SOS/abandon |
| Public / family | Public web | No | Delayed map, follow (later notify) |

Admins do not use the field app for day-of desk work. Riders and volunteers do not need the admin wizard on a phone.

---

## 2. Visual language

**Direction:** cool mist over asphalt — early-start brevet feel. Forest green `#0B6E4F` is the product accent (shared with the APK). Avoid cream/terracotta brochure looks, purple gradients, and dark-mode-by-default.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0f1c24` | Primary text |
| `--muted` | `#5a6b75` | Secondary text |
| `--paper` | `#eef2f4` | Page atmosphere |
| `--accent` | `#0b6e4f` | CTA, focus, live |
| Brand type | **Syne** | Wordmark / display |
| UI type | **Figtree** | Body, forms, nav |

**Motion (web):** soft hero fade-up, accent underline on active nav, button press scale. Keep motion purposeful — presence, not decoration.

**Android:** same accent and cool scaffold (`#EEF2F4`); glanceable ride screen; large thumb targets on desk. Prefer list/row density over nested cards.

---

## 3. Information architecture

### Admin web

```
/                  Marketing + signed-in home
/auth              Sign in / create account (all roles)
/organise          Events wizard          [admin|owner]
/calculator        ACP times              [signed-in staff]
/control-room      HQ live map            [admin|owner|volunteer]
/control-desk      Laptop desk fallback   [admin|owner|volunteer]
/results           Export                 [admin|owner]
/public            Delayed public board   [open]
/privacy           Consent draft          [open]
/embed             Embed widget           [open, chrome-less]
```

Nav is **role-aware**: logged-out users see Public + Sign in; admins see Events / HQ / Results; volunteers see Desk + HQ.

### Android app

```
Role picker → Sign in / Create account →
  Rider:     Join (code) → Battery checklist → Ride (time in hand)
  Volunteer: Desk | Live tabs
```

Account identity is required before join or desk so check-ins and ride history attach to a person. Join code remains the only event-specific step for riders.

---

## 4. Auth model

Roles align with Supabase `membership_role`: `owner` | `admin` | `volunteer` | `member`, plus app-facing `rider` (member who joins events).

**Capabilities**

- `admin` / `owner` — organise, HQ, results, desk
- `volunteer` — desk + HQ read/confirm
- `rider` / `member` — app join + personal history; no admin wizard
- Anonymous — public board only

**Demo mode** (no `VITE_SUPABASE_*`): seeded accounts with password `demo-password`:

| Email | Role |
| --- | --- |
| `admin@club.example` | admin |
| `volunteer@club.example` | volunteer |
| `rider@club.example` | rider |

Sign-up stores accounts in the browser (web) or SharedPreferences (app) until Supabase is connected.

**Supabase mode:** email/password via Auth; role from `memberships` (fallback to `user_metadata.role`). Profile row is created by the existing `handle_new_user` trigger.

---

## 5. Screen principles

1. **One job per section** — no stats strips in the hero; event metrics live below the fold or inside signed-in home.
2. **Brand first on entry** — role picker and web landing lead with **BRM Tracker**, not a generic dashboard title.
3. **Thumb-first field UI** — desk confirm buttons ≥ 48dp; bib search always visible.
4. **Glanceable ride UI** — time in hand dominates; SOS/Abandon are the only secondary actions.
5. **Public stays light** — delayed positions; no login wall.

---

## 6. Implementation map

| Concern | Web | Android |
| --- | --- | --- |
| Session | `AuthProvider` + localStorage / Supabase | `AuthService` + SharedPreferences |
| Route/role gate | `RequireAuth` | Gate in `AppShell` after login |
| Design tokens | `index.css` CSS variables | `ThemeData` / ColorScheme |
| Copy EN/HI | `i18n.tsx` | EN first (HI later) |

This document is the UI source of truth for pilots; product scope remains in [PRODUCT_PLAN.md](PRODUCT_PLAN.md).
