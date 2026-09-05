-- Migration 0014: body measurements alongside bodyweight
--
-- body_logs already holds one weight per day per user (unique on
-- user_id + logged_at). This adds optional tape measurements to the
-- same row, so a check-in is one entry. All nullable: most days a user
-- logs only weight, and measures every week or two.
--
-- Run in the Supabase SQL Editor after 0013. Safe to re-run.

alter table body_logs alter column weight drop not null;
alter table body_logs add column if not exists waist_cm numeric(5, 1);
alter table body_logs add column if not exists chest_cm numeric(5, 1);
alter table body_logs add column if not exists arm_cm numeric(5, 1);
alter table body_logs add column if not exists thigh_cm numeric(5, 1);
alter table body_logs add column if not exists hip_cm numeric(5, 1);
alter table body_logs add column if not exists note text;
