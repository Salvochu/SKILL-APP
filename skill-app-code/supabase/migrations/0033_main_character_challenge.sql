-- Migration 0033: the "14-Day Main Character" challenge
--
-- The free 14-day challenge, modelled as a mesocycle so it reuses the
-- whole engine (dashboard panel, "start today", done-this-week, the
-- logger's week context). It is Foundations mechanically - two
-- alternating full-body days, linear "beat last time", no RIR ramp, no
-- deload - so it reuses the existing foundations day templates and just
-- adds a new kind ('challenge') that the UI branches on for the
-- "Day X of 14" framing and the end-of-challenge fork.
--
-- Cardio lives on the PDF for now, not in the app.
--
-- Safe to re-run.

alter table mesocycle_templates
  drop constraint if exists mesocycle_templates_kind_check;
alter table mesocycle_templates
  add constraint mesocycle_templates_kind_check
  check (kind in ('mesocycle', 'foundations', 'challenge'));

-- The 14-day challenge is a legitimate 2-week block; the original range
-- (0004) started at 3 weeks.
alter table mesocycle_templates
  drop constraint if exists mesocycle_templates_weeks_range;
alter table mesocycle_templates
  add constraint mesocycle_templates_weeks_range check (weeks between 2 and 8);

-- Its own split, pointing at the existing Foundations day templates
-- (foundations-a / foundations-b). section 'challenge' keeps it out of
-- the browsable split list.
insert into splits (id, name, cadence, description, section, position) values
  ('main-character-14', '14-Day Main Character', '3x per week',
   'Two full-body days plus cardio, run over 14 days. Learn the lifts, build the habit, see the first change.',
   'challenge', 0)
on conflict (id) do update set
  name = excluded.name, cadence = excluded.cadence, description = excluded.description,
  section = excluded.section, position = excluded.position;

insert into split_days (split_id, position, day_template_id) values
  ('main-character-14', 0, 'foundations-a'),
  ('main-character-14', 1, 'foundations-b')
on conflict (split_id, position) do update set day_template_id = excluded.day_template_id;

insert into mesocycle_templates (id, name, description, split_id, weeks, starting_rir, position, kind) values
  ('main-character-14', '14-Day Main Character',
   'Your free 14-day kickstart. Three full-body sessions plus cardio each week, simple progression: when you hit your reps with a couple left in the tank, add a little weight.',
   'main-character-14', 2, 3, 0, 'challenge')
on conflict (id) do update set
  name = excluded.name, description = excluded.description, split_id = excluded.split_id,
  weeks = excluded.weeks, position = excluded.position, kind = excluded.kind;
