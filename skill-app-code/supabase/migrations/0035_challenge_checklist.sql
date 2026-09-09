-- Migration 0035: 14-Day Challenge daily checklist
--
-- Challenge users get a "Challenge" tab with a per-day checklist (stick
-- to the meal plan, weigh in, 10k steps, watched the video, did the
-- session). One row per user per challenge day (1..14); the ticked
-- items live in a small jsonb blob so the set can change without a
-- migration. A day counts as "complete" (drives the progress visual and
-- the streak) when every applicable item is ticked - computed in the
-- app, not here.
--
-- Safe to re-run.

create table if not exists challenge_checklist (
  user_id uuid not null references auth.users(id) on delete cascade,
  day smallint not null check (day between 1 and 14),
  items jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table challenge_checklist enable row level security;

drop policy if exists "users manage their own challenge checklist" on challenge_checklist;
create policy "users manage their own challenge checklist"
  on challenge_checklist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
