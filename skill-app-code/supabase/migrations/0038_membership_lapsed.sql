-- Migration 0038: lapsed membership
--
-- When a paid app subscription ends (voluntary cancel at period end, or
-- dunning finally gives up), the GHL cancellation webhook flips the
-- profile from 'member' to 'lapsed'. A lapsed account keeps its data and
-- read-only screens but cannot log workouts or start programs until it
-- resubscribes - the purchase webhook sets it back to 'member'.
--
-- NULL still means a grandfathered member (predates the column), so a
-- canceller must NOT be set to NULL.
--
-- Safe to re-run.

alter table profiles drop constraint if exists profiles_membership_check;
alter table profiles
  add constraint profiles_membership_check
  check (membership is null or membership in ('challenge', 'member', 'coach', 'lapsed'));
