-- Migration 0041: Bulgarian Split Squat is a dumbbell movement
--
-- It was tagged "Bodyweight" and named "Bulgarian Split Squat", but the
-- form video shows it done holding a pair of dumbbells. Same exercise
-- id, same video. Safe to re-run.

update exercises
set equipment = 'Dumbbell', name = 'DB Bulgarian Split Squats'
where name = 'Bulgarian Split Squat' and equipment = 'Bodyweight';
