-- Migration 0037: 14-Day Challenge prep window
--
-- A challenge account no longer starts its 14-day clock at purchase.
-- The run is created with started_at NULL ("getting set up") and the
-- app shows a prep screen: the welcome video, the setup steps, and a
-- "Start my 14 days" button that stamps started_at (and realigns
-- start_date) to that day. Day 1 is counted from started_at.
--
-- Existing challenge runs are already underway, so backfill started_at
-- from their start_date. Safe to re-run.

alter table user_mesocycles add column if not exists started_at date;

update user_mesocycles
  set started_at = start_date
  where template_id = 'main-character-14'
    and started_at is null;
