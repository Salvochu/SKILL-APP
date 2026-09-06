-- Migration 0021: rest-timer preference
--
-- The Settings screen (formerly Notifications) now also holds workout
-- preferences. First one: whether the rest timer pops up after a logged
-- set. Default on, matching current behaviour.
--
-- Safe to re-run.

alter table notification_prefs add column if not exists rest_timer_enabled boolean not null default true;
