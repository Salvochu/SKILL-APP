-- Migration 0006: equipment variant on a mesocycle run
--
-- The 4 primary splits have real equipment variants (Full Gym, Dumbbells,
-- Bodyweight); the coached Superman splits have only "Standard". Starting
-- a mesocycle now records which one the user picked, so every day of
-- that run uses it consistently instead of the app guessing.
--
-- Run in the Supabase SQL Editor after 0005. Safe to re-run.

alter table user_mesocycles add column if not exists variant text;

-- Backfill existing runs of the single-variant Superman templates, the
-- only ones where the correct value is unambiguous.
update user_mesocycles
set variant = 'Standard'
where variant is null
  and template_id in ('superman-5-meso', 'superman-6-meso');
