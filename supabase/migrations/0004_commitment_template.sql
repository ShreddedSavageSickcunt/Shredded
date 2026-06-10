-- ============================================================
--  Shredded — migration 0004: track which template a habit came from
--  Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ============================================================

-- Lets us prevent the same template habit being added twice (custom
-- habits leave this null).
alter table public.commitments add column if not exists template_id text;
