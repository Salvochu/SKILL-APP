-- Migration 0040: default rest length preference
--
-- The rest timer opened at a fixed 90 seconds. This stores the length
-- each user prefers so it is not something they have to change on every
-- set. Editable in Settings and in the logger's own settings row.
-- Default 90, matching the old fixed value. Safe to re-run.

alter table notification_prefs
  add column if not exists default_rest_seconds smallint not null default 90;
