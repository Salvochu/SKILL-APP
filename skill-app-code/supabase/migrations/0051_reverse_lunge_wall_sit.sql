-- Migration 0051: add Reverse Lunge and Wall Sit
--
-- A client (feedback, 2026-11-09) could not find either when logging a
-- workout. Both are Legs, bodyweight, category 'exercise' so they show
-- in the logger. Wall Sit is logged as a timed hold automatically
-- (lib/exercises.js isTimeBasedExercise matches "wall sit"), so it never
-- feeds the 1RM / PR maths.
--
-- No video yet: video_url stays null and the app simply hides the play
-- button. Add the Loom link later with:
--   update exercises set video_url = '<loom link>' where name = 'Reverse Lunge';
--
-- Muscle tags follow the existing Split Squat / Walking Lunge mapping
-- (migration 0017). Run in the Supabase SQL Editor. Safe to re-run.

insert into exercises (name, category, muscle, equipment, instructions) values
  ('Reverse Lunge', 'exercise', 'Legs', 'Bodyweight', 'Step one foot back and drop the back knee toward the floor, front shin stays upright, drive through the front heel to stand.'),
  ('Wall Sit', 'exercise', 'Legs', 'Bodyweight', 'Back flat against the wall, slide down until your thighs are parallel to the floor, knees over ankles, hold.')
on conflict (name) do update set
  category = excluded.category,
  muscle = excluded.muscle,
  equipment = excluded.equipment,
  instructions = excluded.instructions;

insert into exercise_muscles (exercise_id, muscle_id, role)
select e.id, m.muscle_id, m.role
from exercises e
join (values
  ('Reverse Lunge', 'quads', 'primary'),
  ('Reverse Lunge', 'glutes', 'primary'),
  ('Reverse Lunge', 'hamstrings', 'secondary'),
  ('Reverse Lunge', 'adductors', 'secondary'),
  ('Reverse Lunge', 'calves', 'secondary'),
  ('Wall Sit', 'quads', 'primary'),
  ('Wall Sit', 'glutes', 'secondary')
) as m(name, muscle_id, role) on m.name = e.name
on conflict (exercise_id, muscle_id) do update set role = excluded.role;
