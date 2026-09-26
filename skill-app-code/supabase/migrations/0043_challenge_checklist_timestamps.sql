-- Migration 0043: per-item timestamps on the daily challenge checklist
--
-- Lets the UI show "ticked 2h ago" next to each checklist item, so an
-- auto-ticked box (weight/session/video) doesn't read as having just
-- happened when it actually happened earlier. Safe to re-run.

alter table challenge_checklist
  add column if not exists items_at jsonb not null default '{}'::jsonb;
