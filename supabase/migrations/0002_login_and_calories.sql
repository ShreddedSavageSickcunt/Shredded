-- ============================================================
--  Shredded — migration 0002: basic login + calorie inputs
--  Paste into the Supabase SQL Editor and Run. Safe to re-run.
--
--  NOTE: `password` is stored in plain text. This is a lightweight gate
--  for a trusted friends PoC, NOT real security. Replace with Supabase
--  Auth (hashed passwords) before opening this up more widely.
-- ============================================================

alter table public.members
  add column if not exists username        text,
  add column if not exists password        text,
  add column if not exists sex             text,     -- 'male' | 'female' (for Mifflin-St Jeor)
  add column if not exists activity_factor numeric;  -- e.g. 1.2, 1.55 …

-- Case-insensitive unique usernames (multiple NULLs are allowed, so existing
-- members without a username are unaffected).
create unique index if not exists members_username_key
  on public.members (lower(username));
