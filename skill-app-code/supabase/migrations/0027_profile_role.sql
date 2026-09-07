-- Migration 0027: a role on the profile
--
-- 'client' for everyone (the default), 'coach' for the SK Fitness coach.
-- The coach view (a read-only overview of every client's training, for
-- spotting who to invite to 1:1 coaching) is gated on this. No RLS
-- changes: the coach screens read through the service-role client in
-- server code, guarded by this flag.
--
-- Safe to re-run.

alter table profiles
  add column if not exists role text not null default 'client';

alter table profiles
  drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check check (role in ('client', 'coach'));

-- Make the coach a coach. Profile row is created on first sign-in / by
-- the onboarding flow, so upsert in case it is not there yet.
insert into profiles (user_id, role)
select id, 'coach' from auth.users where email = 'salvador.joz17@gmail.com'
on conflict (user_id) do update set role = 'coach';
