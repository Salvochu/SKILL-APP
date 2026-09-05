-- Migration 0010: give Hip Thrust a form video
--
-- Hip Thrust was the one exercise left without a Loom clip after the
-- 0001 import (video_url was null). The public exercise library folder
-- has a dedicated "Barbell Hip Thrust" recording, which matches the
-- exercise (barbell, glutes) better than the floor glute bridge stand-in
-- the mapping sheet had used.
--
-- Already applied to the live DB via the REST API on 2026-09-05; this
-- file keeps the repo in step. Safe to re-run.

update exercises
set video_url = 'https://www.loom.com/share/1b61ccae452b4e4d9766dddae7356a5f'
where name = 'Hip Thrust' and video_url is null;
