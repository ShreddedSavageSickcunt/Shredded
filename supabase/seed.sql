-- ============================================================
--  Shredded — optional starter data
--  Run AFTER schema.sql so the app isn't empty on first load.
--  Edit the names / access codes / dates to match your group.
-- ============================================================

insert into public.group_settings
  (challenge_name, team_name, start_date, end_date, checkin_frequency_days)
values
  ('Summer Shred 2026', 'The Shredded Squad',
   current_date, current_date + interval '90 days', 7);

-- One admin to start with. Use this name + access_code to sign in,
-- then add the rest of the crew from the Admin page.
insert into public.members (name, access_code, is_admin)
values ('Alex', 'squad42', true);
