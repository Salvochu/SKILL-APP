-- Migration 0026: Strength Check covers all six movement patterns
--
-- Adds Overhead Press (vert. push) and Barbell Row (horiz. pull) so one
-- Strength Check session produces the whole Strength Score, not four of
-- the six patterns. New order runs legs -> push -> pull:
--   Back Squat, Bench Press, Overhead Press, Deadlift, Barbell Row,
--   then Pull Up (bar) or Lat Pulldown (cable).
--
-- Safe to re-run: the day's exercise rows are rebuilt from scratch.

delete from day_template_exercises where day_template_id = 'strength-check';

insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) values
  ('strength-check', 'Pull-ups', 0, '13705992-0f4b-4b48-bfeb-65c6dbcde9da', 1, '1-5'),
  ('strength-check', 'Pull-ups', 1, '610d9b10-902f-4db8-ac31-8a1a91500523', 1, '1-5'),
  ('strength-check', 'Pull-ups', 2, 'c21892f9-91ee-4ddd-bc24-8f56239e1075', 1, '1-5'),
  ('strength-check', 'Pull-ups', 3, '0a301d89-6c6e-4243-b481-7e2e567150d1', 1, '1-5'),
  ('strength-check', 'Pull-ups', 4, '3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 1, '1-5'),
  ('strength-check', 'Pull-ups', 5, '3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 0, '13705992-0f4b-4b48-bfeb-65c6dbcde9da', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 1, '610d9b10-902f-4db8-ac31-8a1a91500523', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 2, 'c21892f9-91ee-4ddd-bc24-8f56239e1075', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 3, '0a301d89-6c6e-4243-b481-7e2e567150d1', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 4, '3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 5, '82957e44-931a-4eea-8765-c9712e83a68b', 1, '1-5');
