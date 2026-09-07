-- The per-exercise history views (the "last time" popup in the logger and
-- the full exercise history page) filter workout_sets by exercise_id.
-- Without an index that is a sequential scan of every set ever logged;
-- fine now, slow once real users build up history. Add it before launch.
create index if not exists workout_sets_exercise_idx on workout_sets (exercise_id);
