-- Migration 0009: split the library into exercises, stretches and education
--
-- The Library tab becomes three sections. Exercises and stretches share
-- the same shape (name, muscle, coaching text, a Loom video), so a
-- `category` column on `exercises` tells them apart rather than a second
-- near-identical table. Everything already in the table is an exercise,
-- hence the default. `getExercises` (the workout logger's picker and the
-- Exercise Library) filters to category = 'exercise'; stretches only
-- ever show in the Stretching Library.
--
-- Education is a different shape (a title and a teaching video, no muscle
-- or equipment), so it gets its own small table.
--
-- Run in the Supabase SQL Editor after 0008. Safe to re-run. Content
-- (the actual stretches and videos) is seeded in later migrations once
-- the Loom links are in hand.

alter table exercises add column if not exists category text not null default 'exercise';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exercises_category_check'
  ) then
    alter table exercises
      add constraint exercises_category_check
      check (category in ('exercise', 'stretch'));
  end if;
end $$;

create index if not exists exercises_category_idx on exercises(category, name);

create table if not exists education_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists education_videos_position_idx on education_videos(position, created_at);

alter table education_videos enable row level security;

drop policy if exists "education videos are readable by authenticated users" on education_videos;
create policy "education videos are readable by authenticated users"
  on education_videos for select
  to authenticated
  using (true);
