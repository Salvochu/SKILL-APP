-- Migration 0005: mesocycle templates for the 4 primary splits
--
-- Extends 0004's two Superman programs with the same 5 week, RIR 3-to-0,
-- deload shape for Full Body, Upper Lower, Push Pull Legs + Upper Lower,
-- and Push Pull Legs x2. Primary splits are listed before the coached
-- Superman ones (position 1-4 vs 5-6), matching how Splits already
-- orders its own sections.
--
-- Run in the Supabase SQL Editor after 0004. Safe to re-run.

insert into mesocycle_templates (id, name, description, split_id, weeks, starting_rir, position)
values
  (
    'full-body-meso',
    'Full Body, 5 Week Program',
    'A guided 5 week run of the Full Body split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'full-body', 5, 3, 1
  ),
  (
    'upper-lower-meso',
    'Upper Lower, 5 Week Program',
    'A guided 5 week run of the Upper Lower split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'upper-lower', 5, 3, 2
  ),
  (
    'ppl-ul-meso',
    'Push Pull Legs + Upper Lower, 5 Week Program',
    'A guided 5 week run of the Push Pull Legs + Upper Lower split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'ppl-ul', 5, 3, 3
  ),
  (
    'ppl-x2-meso',
    'Push Pull Legs x2, 5 Week Program',
    'A guided 5 week run of the Push Pull Legs x2 split. Effort steps down from 3 reps in reserve to 0 across 4 training weeks, then a lighter deload week.',
    'ppl-x2', 5, 3, 4
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  split_id = excluded.split_id,
  weeks = excluded.weeks,
  starting_rir = excluded.starting_rir,
  position = excluded.position;

-- Move the Superman programs after the primary ones.
update mesocycle_templates set position = 5 where id = 'superman-5-meso';
update mesocycle_templates set position = 6 where id = 'superman-6-meso';
