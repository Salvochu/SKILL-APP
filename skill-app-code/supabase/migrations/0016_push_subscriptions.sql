-- Migration 0016: web push subscriptions for training reminders
--
-- One row per browser/device a user has turned reminders on for. Having
-- at least one row is what "reminders on" means; the toggle deletes the
-- row to turn them off. The reminder sender (app/api/push/reminders)
-- reads these with the service role, so RLS only needs to cover the
-- user managing their own.
--
-- Run in the Supabase SQL Editor after 0015. Safe to re-run.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "users manage their own push subscriptions" on push_subscriptions;
create policy "users manage their own push subscriptions"
  on push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
