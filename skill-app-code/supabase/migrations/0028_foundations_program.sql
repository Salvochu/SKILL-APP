-- Migration 0028: the Foundations program
--
-- A beginner's first month: two alternating full-body days, run 3x a
-- week, with fixed rep targets and simple linear progression (hit your
-- reps, add a little weight). No RIR ramp, no deload - that machinery
-- is for people who already train hard enough to need it.
--
-- Built on the existing mesocycle plumbing: a new mesocycle_templates
-- row with kind = 'foundations', which the data layer and UI branch on
-- to drop the periodisation language.
--
-- Safe to re-run.

alter table mesocycle_templates
  add column if not exists kind text not null default 'mesocycle';
alter table mesocycle_templates
  drop constraint if exists mesocycle_templates_kind_check;
alter table mesocycle_templates
  add constraint mesocycle_templates_kind_check check (kind in ('mesocycle', 'foundations'));

-- Split + days. section 'foundations' keeps it out of the normal
-- browsable split list; it has its own card on the Train page.
insert into splits (id, name, cadence, description, section, position) values
  ('foundations', 'Foundations', '3x per week',
   'Your first month of lifting. Learn the main lifts, add a little weight each session, build the habit.',
   'foundations', 0)
on conflict (id) do update set
  name = excluded.name, cadence = excluded.cadence, description = excluded.description,
  section = excluded.section, position = excluded.position;

insert into day_templates (id, name, focus, description) values
  ('foundations-a', 'Day A', 'Squat, push, pull',
   'Squat, a press and a row. Leave 2 or 3 reps in the tank and focus on clean technique.'),
  ('foundations-b', 'Day B', 'Hinge, press, pull',
   'A hinge, an overhead press and a pull. Same idea: solid form, a couple of reps left in reserve.')
on conflict (id) do update set
  name = excluded.name, focus = excluded.focus, description = excluded.description;

insert into split_days (split_id, position, day_template_id) values
  ('foundations', 0, 'foundations-a'),
  ('foundations', 1, 'foundations-b')
on conflict (split_id, position) do update set day_template_id = excluded.day_template_id;

delete from day_template_exercises where day_template_id in ('foundations-a', 'foundations-b');

insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) values
  -- Day A, full gym
  ('foundations-a', 'Full Gym', 0, '13705992-0f4b-4b48-bfeb-65c6dbcde9da', 3, '8'),
  ('foundations-a', 'Full Gym', 1, '610d9b10-902f-4db8-ac31-8a1a91500523', 3, '8'),
  ('foundations-a', 'Full Gym', 2, '3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 3, '10'),
  ('foundations-a', 'Full Gym', 3, '03fecf87-eb8e-4732-9f8f-8374f3479709', 3, '40s'),
  -- Day A, dumbbells
  ('foundations-a', 'Dumbbells', 0, 'b6bf64cb-b59c-4e52-a846-03b91ffb7942', 3, '10'),
  ('foundations-a', 'Dumbbells', 1, '0ec26cd0-ac7e-4884-aaa6-89ba8d5bcff1', 3, '10'),
  ('foundations-a', 'Dumbbells', 2, '96943ade-68b6-40d9-a5d9-d21e382885a6', 3, '10'),
  ('foundations-a', 'Dumbbells', 3, '03fecf87-eb8e-4732-9f8f-8374f3479709', 3, '40s'),
  -- Day B, full gym
  ('foundations-b', 'Full Gym', 0, '0a301d89-6c6e-4243-b481-7e2e567150d1', 2, '6'),
  ('foundations-b', 'Full Gym', 1, 'c21892f9-91ee-4ddd-bc24-8f56239e1075', 3, '8'),
  ('foundations-b', 'Full Gym', 2, '82957e44-931a-4eea-8765-c9712e83a68b', 3, '10'),
  ('foundations-b', 'Full Gym', 3, '03fecf87-eb8e-4732-9f8f-8374f3479709', 3, '40s'),
  -- Day B, dumbbells
  ('foundations-b', 'Dumbbells', 0, '67e653a1-4c80-477a-b34a-0dcf2bb516b5', 3, '10'),
  ('foundations-b', 'Dumbbells', 1, 'f5b4a68a-ccc3-4d10-8c78-567b552f4f91', 3, '10'),
  ('foundations-b', 'Dumbbells', 2, '96943ade-68b6-40d9-a5d9-d21e382885a6', 3, '12'),
  ('foundations-b', 'Dumbbells', 3, '03fecf87-eb8e-4732-9f8f-8374f3479709', 3, '40s');

insert into mesocycle_templates (id, name, description, split_id, weeks, starting_rir, position, kind) values
  ('foundations', 'Foundations',
   'Two full-body days, three times a week for four weeks. Fixed rep targets: when you hit them all on a lift, add a little weight next time. No deload, no fuss.',
   'foundations', 4, 3, 0, 'foundations')
on conflict (id) do update set
  name = excluded.name, description = excluded.description, split_id = excluded.split_id,
  weeks = excluded.weeks, position = excluded.position, kind = excluded.kind;
