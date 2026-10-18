-- BRM Tracker India — core schema (Supabase / Postgres)
-- Apply via Supabase SQL editor or `supabase db push` when CLI is configured.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clubs & memberships
-- ---------------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.membership_role as enum ('owner', 'admin', 'volunteer', 'member');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_club_id_idx on public.memberships (club_id);

-- ---------------------------------------------------------------------------
-- Events & controls
-- ---------------------------------------------------------------------------
create type public.event_status as enum (
  'draft',
  'published',
  'live',
  'finished',
  'cancelled'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  distance_km integer not null check (distance_km between 100 and 1200),
  start_at timestamptz not null,
  status public.event_status not null default 'draft',
  join_code text not null unique,
  gpx_url text,
  public_delay_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_club_id_idx on public.events (club_id);
create index events_join_code_idx on public.events (join_code);
create index events_status_idx on public.events (status);

create table public.controls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  seq integer not null,
  name text not null,
  km numeric(8, 2) not null,
  lat double precision,
  lng double precision,
  open_at timestamptz not null,
  close_at timestamptz not null,
  open_override boolean not null default false,
  close_override boolean not null default false,
  geofence_radius_m integer not null default 200,
  created_at timestamptz not null default now(),
  unique (event_id, seq)
);

create index controls_event_id_idx on public.controls (event_id);

-- ---------------------------------------------------------------------------
-- Entries (riders in an event)
-- ---------------------------------------------------------------------------
create type public.entry_status as enum (
  'registered',
  'started',
  'finished',
  'abandoned',
  'dnf'
);

create type public.visibility as enum ('public', 'followers', 'organiser');

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  nickname text not null,
  bib text,
  emergency_contact text,
  consent_tracking boolean not null default false,
  consent_public boolean not null default false,
  visibility public.visibility not null default 'organiser',
  status public.entry_status not null default 'registered',
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_event_id_idx on public.entries (event_id);
create index entries_user_id_idx on public.entries (user_id);

-- ---------------------------------------------------------------------------
-- Positions (batched uploads from rider app)
-- ---------------------------------------------------------------------------
create table public.positions (
  id bigserial primary key,
  entry_id uuid not null references public.entries (id) on delete cascade,
  recorded_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  battery_pct smallint,
  created_at timestamptz not null default now()
);

create index positions_entry_recorded_idx on public.positions (entry_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------
create type public.checkin_source as enum ('auto', 'volunteer', 'manual');

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  control_id uuid not null references public.controls (id) on delete cascade,
  checked_at timestamptz not null,
  source public.checkin_source not null,
  confirmed_by uuid references public.profiles (id) on delete set null,
  late boolean not null default false,
  undone_at timestamptz,
  created_at timestamptz not null default now(),
  unique (entry_id, control_id)
);

create index checkins_control_id_idx on public.checkins (control_id);

-- ---------------------------------------------------------------------------
-- Alerts & follows
-- ---------------------------------------------------------------------------
create type public.alert_type as enum ('stopped', 'cutoff_risk', 'sos');

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  type public.alert_type not null,
  message text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index alerts_entry_active_idx on public.alerts (entry_id, active);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  follower_email text,
  follower_user_id uuid references public.profiles (id) on delete cascade,
  notify_controls boolean not null default true,
  notify_finish boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    follower_email is not null
    or follower_user_id is not null
  )
);

create index follows_entry_id_idx on public.follows (entry_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger clubs_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS (starter policies — tighten before a real event)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.memberships enable row level security;
alter table public.events enable row level security;
alter table public.controls enable row level security;
alter table public.entries enable row level security;
alter table public.positions enable row level security;
alter table public.checkins enable row level security;
alter table public.alerts enable row level security;
alter table public.follows enable row level security;

-- Profiles: users can read/update self
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id);

-- Clubs: readable by members; insert by authenticated; update by admin/owner
create policy clubs_select_member on public.clubs
  for select using (
    exists (
      select 1 from public.memberships m
      where m.club_id = clubs.id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.events e
      where e.club_id = clubs.id and e.status in ('published', 'live', 'finished')
    )
  );

create policy clubs_insert_auth on public.clubs
  for insert with check (auth.uid() is not null);

create policy clubs_update_admin on public.clubs
  for update using (
    exists (
      select 1 from public.memberships m
      where m.club_id = clubs.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Memberships
create policy memberships_select_club on public.memberships
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.club_id = memberships.club_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy memberships_insert_admin on public.memberships
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.club_id = memberships.club_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Events: public when published+; club staff always
create policy events_select on public.events
  for select using (
    status in ('published', 'live', 'finished')
    or exists (
      select 1 from public.memberships m
      where m.club_id = events.club_id and m.user_id = auth.uid()
    )
  );

create policy events_write_admin on public.events
  for all using (
    exists (
      select 1 from public.memberships m
      where m.club_id = events.club_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Controls follow event visibility
create policy controls_select on public.controls
  for select using (
    exists (
      select 1 from public.events e
      where e.id = controls.event_id
        and (
          e.status in ('published', 'live', 'finished')
          or exists (
            select 1 from public.memberships m
            where m.club_id = e.club_id and m.user_id = auth.uid()
          )
        )
    )
  );

create policy controls_write_admin on public.controls
  for all using (
    exists (
      select 1 from public.events e
      join public.memberships m on m.club_id = e.club_id
      where e.id = controls.event_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'volunteer')
    )
  );

-- Entries: organisers see all; public see limited rows (app layer also filters)
create policy entries_select on public.entries
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      join public.memberships m on m.club_id = e.club_id
      where e.id = entries.event_id and m.user_id = auth.uid()
    )
    or (
      visibility = 'public'
      and exists (
        select 1 from public.events e
        where e.id = entries.event_id
          and e.status in ('published', 'live', 'finished')
      )
    )
  );

create policy entries_insert on public.entries
  for insert with check (
    auth.uid() is not null
    or true -- allow anonymous join via edge function later; tighten then
  );

create policy entries_update_self_or_staff on public.entries
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      join public.memberships m on m.club_id = e.club_id
      where e.id = entries.event_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'volunteer')
    )
  );

-- Positions: rider can insert own; staff can read; public delayed via snapshot not this table
create policy positions_insert_own on public.positions
  for insert with check (
    exists (
      select 1 from public.entries en
      where en.id = positions.entry_id
        and (en.user_id = auth.uid() or en.device_id is not null)
    )
  );

create policy positions_select_staff_or_own on public.positions
  for select using (
    exists (
      select 1 from public.entries en
      where en.id = positions.entry_id and en.user_id = auth.uid()
    )
    or exists (
      select 1 from public.entries en
      join public.events e on e.id = en.event_id
      join public.memberships m on m.club_id = e.club_id
      where en.id = positions.entry_id and m.user_id = auth.uid()
    )
  );

create policy checkins_select on public.checkins
  for select using (true);

create policy checkins_write_staff on public.checkins
  for all using (
    exists (
      select 1 from public.entries en
      join public.events e on e.id = en.event_id
      join public.memberships m on m.club_id = e.club_id
      where en.id = checkins.entry_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'volunteer')
    )
  );

create policy alerts_select_staff_or_own on public.alerts
  for select using (
    exists (
      select 1 from public.entries en
      where en.id = alerts.entry_id and en.user_id = auth.uid()
    )
    or exists (
      select 1 from public.entries en
      join public.events e on e.id = en.event_id
      join public.memberships m on m.club_id = e.club_id
      where en.id = alerts.entry_id and m.user_id = auth.uid()
    )
  );

create policy alerts_insert on public.alerts
  for insert with check (true);

create policy follows_select_own on public.follows
  for select using (
    follower_user_id = auth.uid()
    or exists (
      select 1 from public.entries en
      join public.events e on e.id = en.event_id
      join public.memberships m on m.club_id = e.club_id
      where en.id = follows.entry_id and m.user_id = auth.uid()
    )
  );

create policy follows_insert on public.follows
  for insert with check (true);
