-- ============================================================
--  Shredded — database schema
--  Paste this whole file into the Supabase SQL Editor and Run.
--  (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- members ----------
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_date   date not null default current_date,
  is_admin    boolean not null default false,
  access_code text not null
);

-- ---------- goals ----------
create table if not exists public.goals (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid not null references public.members(id) on delete cascade,
  starting_weight_kg   numeric,
  target_weight_kg     numeric,
  daily_calorie_target integer,
  principles           text,
  created_at           timestamptz not null default now()
);

-- ---------- checkins ----------
create table if not exists public.checkins (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members(id) on delete cascade,
  checkin_date      date not null default current_date,
  weight_kg         numeric,
  calories_consumed integer,
  vibe_rating       integer check (vibe_rating between 1 and 5),
  notes             text,
  photo_url         text,
  created_at        timestamptz not null default now()
);

-- ---------- group_settings ----------
create table if not exists public.group_settings (
  id                     uuid primary key default gen_random_uuid(),
  challenge_name         text,
  team_name              text,
  start_date             date,
  end_date               date,
  checkin_frequency_days integer default 7,
  created_at             timestamptz not null default now()
);

-- ---------- reactions ----------
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_goals_member      on public.goals(member_id);
create index if not exists idx_checkins_member   on public.checkins(member_id);
create index if not exists idx_reactions_checkin on public.reactions(checkin_id);

-- ============================================================
--  Row Level Security
--  This is a fully transparent app for a trusted friend group and
--  there is no auth yet, so we allow the public (anon) key to do
--  everything. Tighten these later if you add real auth.
-- ============================================================
alter table public.members        enable row level security;
alter table public.goals          enable row level security;
alter table public.checkins       enable row level security;
alter table public.group_settings enable row level security;
alter table public.reactions      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['members','goals','checkins','group_settings','reactions']
  loop
    execute format('drop policy if exists "anon full access" on public.%I;', t);
    execute format(
      'create policy "anon full access" on public.%I for all to anon using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ============================================================
--  Storage bucket for check-in photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read"  on storage.objects;
drop policy if exists "photos anon write"    on storage.objects;

create policy "photos public read"
  on storage.objects for select
  using (bucket_id = 'checkin-photos');

create policy "photos anon write"
  on storage.objects for insert to anon
  with check (bucket_id = 'checkin-photos');
