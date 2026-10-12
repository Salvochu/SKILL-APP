-- Migration 0045: group names for My Workouts
--
-- A lightweight way to organize saved workouts into folders the user
-- names themselves (e.g. "Push/Pull/Legs"), shown as a label on the
-- workout rather than a real multi-day split (no schedule, no order,
-- no days-of-week). Null/empty stays "Ungrouped" on the Train tab.
--
-- Safe to re-run.

alter table my_workouts
  add column if not exists group_name text;
