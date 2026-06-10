-- ============================================================
--  Shredded — migration 0001: profiles + teams
--  Paste into the Supabase SQL Editor and Run.
--  Safe to run more than once (guarded with IF NOT EXISTS).
-- ============================================================

-- ---------- profile fields on members ----------
alter table public.members
  add column if not exists age               integer,
  add column if not exists height_cm         numeric,
  add column if not exists current_weight_kg numeric,
  add column if not exists team_id           uuid;

-- Self sign-up no longer needs an admin-issued code.
alter table public.members alter column access_code drop not null;

-- ---------- teams ----------
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  join_code    text unique not null,
  cadence_days integer not null default 7,
  created_at   timestamptz not null default now()
);

-- Link members -> teams (guarded so re-running won't error).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_team_id_fkey'
  ) then
    alter table public.members
      add constraint members_team_id_fkey
      foreign key (team_id) references public.teams(id) on delete set null;
  end if;
end $$;

create index if not exists idx_members_team on public.members(team_id);

-- ---------- goal timeframe ----------
alter table public.goals add column if not exists target_date date;

-- ---------- RLS for teams (open, consistent with the rest of the PoC) ----------
alter table public.teams enable row level security;
drop policy if exists "anon full access" on public.teams;
create policy "anon full access" on public.teams for all to anon using (true) with check (true);

-- ---------- migrate the existing single group into a team ----------
do $$
declare
  gs   record;
  tid  uuid;
  code text;
begin
  if not exists (select 1 from public.teams) then
    select * into gs from public.group_settings order by created_at desc limit 1;
    code := upper(substr(md5(random()::text), 1, 6));
    insert into public.teams (name, join_code, cadence_days)
      values (
        coalesce(nullif(gs.team_name, ''), 'My Team'),
        code,
        coalesce(gs.checkin_frequency_days, 7)
      )
      returning id into tid;
    update public.members set team_id = tid where team_id is null;
  end if;
end $$;
