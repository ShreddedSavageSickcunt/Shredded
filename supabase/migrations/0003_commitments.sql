-- ============================================================
--  Shredded — migration 0003: habits (commitments) + check-in adherence
--  Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ============================================================

-- Habits / action-goals a member commits to.
create table if not exists public.commitments (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members(id) on delete cascade,
  category   text not null,
  label      text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_commitments_member on public.commitments(member_id);

alter table public.commitments enable row level security;
drop policy if exists "anon full access" on public.commitments;
create policy "anon full access" on public.commitments for all to anon using (true) with check (true);

-- Check-in now records how many habits were kept (the calorie field stays
-- nullable and is no longer collected).
alter table public.checkins
  add column if not exists commitments_total integer,
  add column if not exists commitments_met   integer,
  add column if not exists met_ids           jsonb;
