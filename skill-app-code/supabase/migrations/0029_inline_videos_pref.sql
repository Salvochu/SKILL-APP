-- Migration 0029: "show form videos in the logger" preference
--
-- When on, the log screen keeps a small form video next to each
-- exercise instead of a tap-to-open button. Off by default.
--
-- Safe to re-run.

alter table notification_prefs
  add column if not exists inline_videos boolean not null default false;
