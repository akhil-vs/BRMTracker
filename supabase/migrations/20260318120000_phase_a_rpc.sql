-- Phase A+: waves, join RPC, retention helper, tighten entry inserts

alter table public.entries
  add column if not exists wave text,
  add column if not exists start_offset_minutes integer not null default 0;

alter table public.events
  add column if not exists trim_start_km numeric(6, 2) not null default 2,
  add column if not exists trim_finish_km numeric(6, 2) not null default 2,
  add column if not exists gpx_text text;

-- Drop overly permissive insert; join goes through RPC
drop policy if exists entries_insert on public.entries;

create policy entries_insert_staff on public.entries
  for insert with check (
    exists (
      select 1 from public.events e
      join public.memberships m on m.club_id = e.club_id
      where e.id = entries.event_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'volunteer')
    )
  );

-- Rider/public join by code (security definer)
create or replace function public.join_event(
  p_join_code text,
  p_nickname text,
  p_device_id text,
  p_consent_tracking boolean,
  p_consent_public boolean,
  p_visibility public.visibility default 'public',
  p_emergency_contact text default null,
  p_bib text default null
)
returns public.entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_entry public.entries;
begin
  select * into v_event
  from public.events
  where upper(join_code) = upper(trim(p_join_code))
    and status in ('published', 'live')
  limit 1;

  if v_event.id is null then
    raise exception 'Event not found or not open for joining';
  end if;

  if coalesce(p_consent_tracking, false) is not true then
    raise exception 'Tracking consent required';
  end if;

  if p_device_id is not null then
    select * into v_entry
    from public.entries
    where event_id = v_event.id and device_id = p_device_id
    limit 1;

    if v_entry.id is not null then
      update public.entries set
        nickname = coalesce(nullif(trim(p_nickname), ''), nickname),
        consent_tracking = true,
        consent_public = coalesce(p_consent_public, consent_public),
        visibility = coalesce(p_visibility, visibility),
        emergency_contact = coalesce(p_emergency_contact, emergency_contact),
        updated_at = now()
      where id = v_entry.id
      returning * into v_entry;
      return v_entry;
    end if;
  end if;

  insert into public.entries (
    event_id, nickname, bib, emergency_contact,
    consent_tracking, consent_public, visibility, device_id, status
  ) values (
    v_event.id,
    trim(p_nickname),
    nullif(trim(coalesce(p_bib, '')), ''),
    p_emergency_contact,
    true,
    coalesce(p_consent_public, false),
    coalesce(p_visibility, 'public'),
    p_device_id,
    'registered'
  )
  returning * into v_entry;

  return v_entry;
end;
$$;

grant execute on function public.join_event to anon, authenticated;

-- Batch position upload from rider device
create or replace function public.upload_positions(
  p_entry_id uuid,
  p_device_id text,
  p_points jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
  v_count integer := 0;
  r jsonb;
begin
  select exists (
    select 1 from public.entries
    where id = p_entry_id
      and device_id = p_device_id
      and consent_tracking = true
  ) into v_ok;

  if not v_ok then
    raise exception 'Unauthorized position upload';
  end if;

  for r in select * from jsonb_array_elements(p_points)
  loop
    insert into public.positions (entry_id, recorded_at, lat, lng, accuracy_m, battery_pct)
    values (
      p_entry_id,
      (r->>'recorded_at')::timestamptz,
      (r->>'lat')::double precision,
      (r->>'lng')::double precision,
      nullif(r->>'accuracy_m', '')::double precision,
      nullif(r->>'battery_pct', '')::smallint
    );
    v_count := v_count + 1;
  end loop;

  update public.entries
  set status = case when status = 'registered' then 'started' else status end,
      updated_at = now()
  where id = p_entry_id;

  return v_count;
end;
$$;

grant execute on function public.upload_positions to anon, authenticated;

-- Volunteer confirm check-in
create or replace function public.confirm_checkin(
  p_entry_id uuid,
  p_control_id uuid,
  p_volunteer_name text default null
)
returns public.checkins
language plpgsql
security definer
set search_path = public
as $$
declare
  v_control public.controls;
  v_entry public.entries;
  v_checkin public.checkins;
  v_late boolean;
begin
  select * into v_control from public.controls where id = p_control_id;
  select * into v_entry from public.entries where id = p_entry_id;
  if v_control.id is null or v_entry.id is null then
    raise exception 'Entry or control not found';
  end if;
  if v_control.event_id <> v_entry.event_id then
    raise exception 'Control does not belong to entry event';
  end if;

  -- Staff check when authenticated; allow demo/service with grant
  if auth.uid() is not null then
    if not exists (
      select 1 from public.events e
      join public.memberships m on m.club_id = e.club_id
      where e.id = v_entry.event_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'volunteer')
    ) then
      raise exception 'Not authorized';
    end if;
  end if;

  v_late := now() > v_control.close_at;

  update public.checkins
  set undone_at = now()
  where entry_id = p_entry_id and control_id = p_control_id and undone_at is null;

  insert into public.checkins (
    entry_id, control_id, checked_at, source, confirmed_by, late
  ) values (
    p_entry_id,
    p_control_id,
    now(),
    'volunteer',
    auth.uid(),
    v_late
  )
  returning * into v_checkin;

  -- Snap "last" via a position row at control
  if v_control.lat is not null and v_control.lng is not null then
    insert into public.positions (entry_id, recorded_at, lat, lng, accuracy_m)
    values (p_entry_id, now(), v_control.lat, v_control.lng, 5);
  end if;

  update public.entries
  set status = case
      when v_control.seq = (
        select max(seq) from public.controls where event_id = v_entry.event_id
      ) then 'finished'::public.entry_status
      else 'started'::public.entry_status
    end,
    updated_at = now()
  where id = p_entry_id;

  return v_checkin;
end;
$$;

grant execute on function public.confirm_checkin to anon, authenticated;

create or replace function public.raise_sos(
  p_entry_id uuid,
  p_device_id text,
  p_message text default 'SOS'
)
returns public.alerts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert public.alerts;
begin
  if not exists (
    select 1 from public.entries
    where id = p_entry_id and device_id = p_device_id
  ) then
    raise exception 'Unauthorized';
  end if;

  insert into public.alerts (entry_id, type, message, active)
  values (p_entry_id, 'sos', p_message, true)
  returning * into v_alert;

  return v_alert;
end;
$$;

grant execute on function public.raise_sos to anon, authenticated;

-- Retention: purge fine GPS older than N days (keep checkins)
create or replace function public.purge_old_positions(p_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.positions
  where recorded_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Auto-create membership when creating a club
create or replace function public.create_club_with_owner(
  p_name text,
  p_slug text,
  p_region text default null
)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.clubs;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  insert into public.clubs (name, slug, region)
  values (p_name, p_slug, p_region)
  returning * into v_club;

  insert into public.memberships (club_id, user_id, role)
  values (v_club.id, auth.uid(), 'owner');

  return v_club;
end;
$$;

grant execute on function public.create_club_with_owner to authenticated;
