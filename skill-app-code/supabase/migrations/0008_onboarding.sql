-- Migration 0008: onboarding quiz flag
--
-- A new signed-up user sees a short profile quiz once, on their first
-- Dashboard visit (components/onboarding). Tracked per profile row; a
-- user with no row at all is also treated as needing it (see
-- lib/data/profile.js's needsOnboarding).
--
-- Existing accounts predate this feature and should not be surprised by
-- a quiz on their next visit, so this backfills every profile that
-- already exists to completed. Only genuinely new signups after this
-- migration see it.
--
-- Run in the Supabase SQL Editor after 0007. Safe to re-run.

alter table profiles add column if not exists onboarding_completed boolean not null default false;

update profiles set onboarding_completed = true where onboarding_completed = false;
