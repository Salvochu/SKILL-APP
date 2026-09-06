-- Migration 0024: mark a set as a warm-up
--
-- Warm-up sets are still logged (the session record stays complete), but
-- they are left out of everything that measures training: hard-set counts
-- per muscle, volume, estimated 1RM, personal records, the Strength
-- Score, XP and mesocycle progression. The workout detail view and the
-- CSV export still show them.
--
-- Safe to re-run.

alter table workout_sets add column if not exists is_warmup boolean not null default false;
