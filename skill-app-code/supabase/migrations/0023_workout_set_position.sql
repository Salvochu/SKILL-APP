-- Migration 0023: a stable ordering column for workout_sets
--
-- getWorkoutDetail groups a session's sets back into exercises. It had
-- nothing to order by but set_number (which restarts at 1 per exercise),
-- so it leaned on the physical row order. That is fine right after a
-- workout is saved, but editing a past set rewrites its row and pushes
-- that exercise to the end. `position` records the order each set was
-- logged across the whole session, independent of both.
--
-- Safe to re-run.

alter table workout_sets add column if not exists position smallint;

-- Backfill existing rows: number them within each session by the order
-- they were created (ctid breaks ties from a single bulk insert).
update workout_sets ws
set position = sub.rn
from (
  select id,
         (row_number() over (partition by session_id order by created_at, ctid) - 1) as rn
  from workout_sets
) sub
where ws.id = sub.id
  and ws.position is null;
