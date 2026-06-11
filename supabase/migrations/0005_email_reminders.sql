-- ============================================================
--  Shredded — migration 0005: email + reminder tracking
--  Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ============================================================

alter table public.members
  add column if not exists email            text,
  add column if not exists last_reminded_at timestamptz;
