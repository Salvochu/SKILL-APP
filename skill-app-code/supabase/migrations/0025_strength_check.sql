-- Migration 0025: the Strength Check benchmark workout
--
-- A preset session - Squat, Bench, Deadlift and one pull - logged like
-- any other workout. One hard top set of 1 to 5 reps per lift feeds the
-- Strength Score. It sits in section 'benchmark' so the Train page can
-- surface it under "Quick start" rather than in the browsable split list.
--
-- Safe to re-run.

insert into splits (id, name, cadence, description, section, position) values
  ('strength-check', 'Strength Check', 'Every 4 to 6 weeks',
   'A quick benchmark of your main lifts. Warm up well, then one hard top set on each.',
   'benchmark', 0)
on conflict (id) do update set
  name = excluded.name,
  cadence = excluded.cadence,
  description = excluded.description,
  section = excluded.section,
  position = excluded.position;

insert into day_templates (id, name, focus, description) values
  ('strength-check', 'Strength Check', 'Benchmark',
   'Warm up thoroughly, then one top set of 1 to 5 reps per lift. Stop about a rep short of failure.')
on conflict (id) do update set
  name = excluded.name,
  focus = excluded.focus,
  description = excluded.description;

insert into split_days (split_id, position, day_template_id) values
  ('strength-check', 0, 'strength-check')
on conflict (split_id, position) do update set day_template_id = excluded.day_template_id;

insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) values
  ('strength-check', 'Pull-ups', 0, '13705992-0f4b-4b48-bfeb-65c6dbcde9da', 1, '1-5'),
  ('strength-check', 'Pull-ups', 1, '610d9b10-902f-4db8-ac31-8a1a91500523', 1, '1-5'),
  ('strength-check', 'Pull-ups', 2, '0a301d89-6c6e-4243-b481-7e2e567150d1', 1, '1-5'),
  ('strength-check', 'Pull-ups', 3, '3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 0, '13705992-0f4b-4b48-bfeb-65c6dbcde9da', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 1, '610d9b10-902f-4db8-ac31-8a1a91500523', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 2, '0a301d89-6c6e-4243-b481-7e2e567150d1', 1, '1-5'),
  ('strength-check', 'Lat pulldown', 3, '82957e44-931a-4eea-8765-c9712e83a68b', 1, '1-5')
on conflict (day_template_id, variant, position) do update set
  exercise_id = excluded.exercise_id,
  sets = excluded.sets,
  reps = excluded.reps;
