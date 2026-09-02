-- SKILL training tracker database schema
-- Run this once in Supabase SQL Editor (Database > SQL Editor > New query)
-- before seed.sql. Safe to re-run: everything is created with IF NOT EXISTS
-- / CREATE OR REPLACE where possible, but tables are only created once.

-- Reference data: exercise library, shared by every user, read-only from
-- the app's point of view (no user ever edits these through the UI).
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  cue text not null,
  video_url text,
  created_at timestamptz not null default now()
);

-- A program is one full training split, e.g. "Superman 6-Day Split".
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  days_per_week integer not null,
  created_at timestamptz not null default now()
);

-- One training day inside a program, e.g. Monday / Chest & Push.
create table if not exists program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  slug text not null,
  code text not null,
  name text not null,
  tag text,
  day_order integer not null,
  unique (program_id, slug)
);

-- The ordered exercises within a training day, with the sets/reps scheme
-- for that program (the same exercise can appear in multiple programs
-- with different sets/reps, so this is its own table rather than a plain
-- join).
create table if not exists program_day_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references program_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position integer not null,
  letter text,
  sets integer not null,
  reps text not null
);

-- A single workout a user actually did. Optionally tied back to a
-- program day (so "log this day again" is one click), but freestanding
-- sessions are allowed too.
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_day_id uuid references program_days(id) on delete set null,
  title text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

-- Individual logged sets within a session.
create table if not exists workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  set_number integer not null,
  reps integer,
  weight numeric(6, 2),
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);

-- Simple bodyweight log for the Progress page.
create table if not exists body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(6, 2) not null,
  logged_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

create index if not exists program_day_exercises_day_idx on program_day_exercises(program_day_id, position);
create index if not exists workout_sessions_user_idx on workout_sessions(user_id, started_at desc);
create index if not exists workout_sets_session_idx on workout_sets(session_id);
create index if not exists body_logs_user_idx on body_logs(user_id, logged_at desc);

-- Row Level Security -----------------------------------------------------

alter table exercises enable row level security;
alter table programs enable row level security;
alter table program_days enable row level security;
alter table program_day_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;
alter table body_logs enable row level security;

-- Reference tables: any signed-in user can read, nobody writes through
-- the app (seed.sql uses the SQL Editor's elevated role, which bypasses
-- RLS).
drop policy if exists "exercises are readable by authenticated users" on exercises;
create policy "exercises are readable by authenticated users"
  on exercises for select
  to authenticated
  using (true);

drop policy if exists "programs are readable by authenticated users" on programs;
create policy "programs are readable by authenticated users"
  on programs for select
  to authenticated
  using (true);

drop policy if exists "program_days are readable by authenticated users" on program_days;
create policy "program_days are readable by authenticated users"
  on program_days for select
  to authenticated
  using (true);

drop policy if exists "program_day_exercises are readable by authenticated users" on program_day_exercises;
create policy "program_day_exercises are readable by authenticated users"
  on program_day_exercises for select
  to authenticated
  using (true);

-- Owner-only tables: a user can only ever see or touch their own rows.
drop policy if exists "users manage their own workout sessions" on workout_sessions;
create policy "users manage their own workout sessions"
  on workout_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users manage their own workout sets" on workout_sets;
create policy "users manage their own workout sets"
  on workout_sets for all
  to authenticated
  using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

drop policy if exists "users manage their own body logs" on body_logs;
create policy "users manage their own body logs"
  on body_logs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
