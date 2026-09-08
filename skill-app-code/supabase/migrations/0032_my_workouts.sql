-- Migration 0032: My workouts
--
-- A "my workout" is a reusable session the user builds themselves: a
-- named, ordered list of exercises with target sets and reps. It is not
-- a program (no weeks, no RIR ramp, no deload) - just a starting point
-- the user can fire off any day, the way they start a split day now.
--
-- my_workouts holds the name + note; my_workout_exercises holds the
-- ordered picks. workout_sessions gains my_workout_id so a logged
-- session remembers which custom workout it came from.
--
-- Safe to re-run.

create table if not exists my_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table my_workouts enable row level security;
drop policy if exists "users manage their own workouts" on my_workouts;
create policy "users manage their own workouts"
  on my_workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists my_workouts_user_idx on my_workouts(user_id, updated_at desc);

create table if not exists my_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  my_workout_id uuid not null references my_workouts(id) on delete cascade,
  position integer not null default 0,
  exercise_id uuid not null references exercises(id) on delete cascade,
  sets smallint not null default 3,
  reps text
);

alter table my_workout_exercises enable row level security;
-- Ownership is inherited from the parent row.
drop policy if exists "users manage their own workout exercises" on my_workout_exercises;
create policy "users manage their own workout exercises"
  on my_workout_exercises for all
  using (
    exists (
      select 1 from my_workouts w
      where w.id = my_workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from my_workouts w
      where w.id = my_workout_id and w.user_id = auth.uid()
    )
  );

create index if not exists my_workout_exercises_workout_idx
  on my_workout_exercises(my_workout_id, position);

alter table workout_sessions
  add column if not exists my_workout_id uuid references my_workouts(id) on delete set null;
