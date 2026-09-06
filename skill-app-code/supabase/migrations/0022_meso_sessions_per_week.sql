-- Migration 0022: sessions per week on a mesocycle run
--
-- Splits like Full Body have one day template repeated 2-3 times a week.
-- The old progress model counted "days in the split" as the weekly
-- target, so Full Body showed 1/1. This lets a run store how many
-- sessions a week the user actually intends, chosen when they start the
-- program. Null falls back to the split's day count (the multi-day
-- splits are unaffected).
--
-- Safe to re-run.

alter table user_mesocycles add column if not exists sessions_per_week smallint;
