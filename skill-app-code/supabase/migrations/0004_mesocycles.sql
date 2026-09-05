-- Migration 0004: mesocycles
--
-- A mesocycle is a split, run on a schedule: mesocycle_templates just
-- points at an existing split and adds a length (weeks) and a starting
-- RIR, everything else (which week someone is in, that week's RIR
-- target, the deload, which day of the split comes next) is computed in
-- the app from a start date and a session count, not stored. See
-- lib/mesocycle.js.
--
-- Run in the Supabase SQL Editor after 0003. Safe to re-run.

create table if not exists mesocycle_templates (
  id text primary key,
  name text not null,
  description text,
  split_id text not null references splits(id) on delete restrict,
  weeks smallint not null,
  starting_rir smallint not null default 3,
  position integer not null default 0
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mesocycle_templates_weeks_range'
  ) then
    alter table mesocycle_templates
      add constraint mesocycle_templates_weeks_range check (weeks between 3 and 8);
  end if;
end $$;

alter table mesocycle_templates enable row level security;
drop policy if exists "mesocycle_templates readable by authenticated users" on mesocycle_templates;
create policy "mesocycle_templates readable by authenticated users"
  on mesocycle_templates for select to authenticated using (true);

create table if not exists user_mesocycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null references mesocycle_templates(id) on delete restrict,
  start_date date not null default current_date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_mesocycles_status_valid'
  ) then
    alter table user_mesocycles
      add constraint user_mesocycles_status_valid check (status in ('active', 'completed', 'abandoned'));
  end if;
end $$;

alter table user_mesocycles enable row level security;
drop policy if exists "users manage their own mesocycles" on user_mesocycles;
create policy "users manage their own mesocycles"
  on user_mesocycles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_mesocycles_user_idx on user_mesocycles(user_id, status);

alter table workout_sessions
  add column if not exists user_mesocycle_id uuid references user_mesocycles(id) on delete set null;

-- Seed: the two Superman splits as guided 5 week mesocycles.
insert into mesocycle_templates (id, name, description, split_id, weeks, starting_rir, position)
values
  (
    'superman-5-meso',
    'Superman 5 Day, 5 Week Program',
    'A guided 5 week run of the Superman 5 Day split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'superman-5', 5, 3, 1
  ),
  (
    'superman-6-meso',
    'Superman 6 Day, 5 Week Program',
    'A guided 5 week run of the Superman 6 Day split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'superman-6', 5, 3, 2
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  split_id = excluded.split_id,
  weeks = excluded.weeks,
  starting_rir = excluded.starting_rir,
  position = excluded.position;
