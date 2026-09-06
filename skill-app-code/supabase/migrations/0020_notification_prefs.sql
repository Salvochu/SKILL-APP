-- Migration 0020: per-user notification preferences
--
-- One row per user. All the push-notification toggles live here; the
-- push_subscriptions table (0016) still holds the actual device
-- endpoints. The daily reminder cron reads this to decide what, if
-- anything, to send each person.
--
-- Safe to re-run.

create table if not exists notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quiet_day_nudge boolean not null default true,
  scheduled_enabled boolean not null default false,
  scheduled_days int[] not null default '{}',
  weekly_recap boolean not null default false,
  streak_at_risk boolean not null default false,
  rest_timer_done boolean not null default false,
  unfinished_workout boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_prefs enable row level security;
drop policy if exists "users manage their own notification prefs" on notification_prefs;
create policy "users manage their own notification prefs"
  on notification_prefs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
