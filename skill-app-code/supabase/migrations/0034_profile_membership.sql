-- Migration 0034: profile membership
--
-- Tells the app how someone got here: a free challenge sign-up, a paying
-- app member, or the coach. NULL means an account that predates this
-- column - grandfathered in as a member.
--
-- The GHL purchase webhook sets this: the challenge product -> 'challenge',
-- the paid product -> 'member'. The app uses it to show the
-- end-of-challenge fork (keep training / work with Salvador) and, later,
-- to gate new workouts once a challenge has lapsed without converting.
--
-- Safe to re-run.

alter table profiles add column if not exists membership text;

alter table profiles drop constraint if exists profiles_membership_check;
alter table profiles
  add constraint profiles_membership_check
  check (membership is null or membership in ('challenge', 'member', 'coach'));
