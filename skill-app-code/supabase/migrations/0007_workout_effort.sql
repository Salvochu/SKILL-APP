-- Migration 0007: perceived effort on a logged session
--
-- A coarse 1 to 5 "how hard was this workout" rating, separate from the
-- per-set RIR. Captured on the post-save summary screen, so it is set
-- with a follow-up update rather than at insert time.
--
-- Run in the Supabase SQL Editor after 0006. Safe to re-run.

alter table workout_sessions add column if not exists perceived_effort smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workout_sessions_effort_range'
  ) then
    alter table workout_sessions
      add constraint workout_sessions_effort_range
      check (perceived_effort is null or (perceived_effort >= 1 and perceived_effort <= 5));
  end if;
end $$;
