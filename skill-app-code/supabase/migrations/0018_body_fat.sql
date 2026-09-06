-- Migration 0018: body-fat percentage on a body check-in
--
-- Optional, like the tape measurements added in 0014. Stored as a plain
-- percentage (e.g. 14.5), nullable.
--
-- Safe to re-run.

alter table body_logs add column if not exists body_fat numeric(4, 1);
