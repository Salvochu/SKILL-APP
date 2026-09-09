-- Migration 0036: rename "DB Row (one arm)" to "DB Row"
--
-- The form video shows the lift done with both arms at once, so the
-- "(one arm)" qualifier is misleading. Same exercise row, same id, same
-- video - just the display name. Safe to re-run.

update exercises set name = 'DB Row' where name = 'DB Row (one arm)';
