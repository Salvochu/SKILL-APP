-- Migration 0044: swap the cable triceps move out of the Dumbbells variant
--
-- 0039 fixed "Overhead Triceps Extension"'s equipment tag to Cable (the
-- form video is the cable rope version), but it was still placed as the
-- last exercise on the Dumbbells variant of the Push and Upper day
-- templates - so a dumbbell-only lifter saw a cable exercise. Swapped for
-- Lying DB Triceps Extension, an actual dumbbell movement, same slot.
-- Safe to re-run.

update day_template_exercises
set exercise_id = (select id from exercises where name = 'Lying DB Triceps Extension')
where variant = 'Dumbbells'
  and exercise_id = (select id from exercises where name = 'Overhead Triceps Extension');
