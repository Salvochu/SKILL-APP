-- Migration 0002: reps in reserve on logged sets
--
-- Adds workout_sets.rir so the logger records how close to failure each
-- set was. It feeds the "last time" readout and the next-target
-- suggestion, and is the base the mesocycle engine builds on later.
--
-- Run in the Supabase SQL Editor after 0001. Safe to re-run.

alter table workout_sets add column if not exists rir smallint;

-- Keep it in a sane range without failing a re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workout_sets_rir_range'
  ) then
    alter table workout_sets
      add constraint workout_sets_rir_range
      check (rir is null or (rir >= 0 and rir <= 10));
  end if;
end $$;
