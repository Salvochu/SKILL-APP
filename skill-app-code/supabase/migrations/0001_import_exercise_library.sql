-- Migration 0001: import the full exercise library from the Google Sheet
--   https://docs.google.com/spreadsheets/d/15uftaS3rPzmu4JnP0-2D4rndFZrKG0lgbtrqSIuAgOg/
--
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New query)
-- AFTER schema.sql and seed.sql. Wrapped in a transaction and written to be
-- safe to re-run.
--
-- What it does:
--   1. Makes exercises.cue optional (the sheet has no coaching cues).
--   2. Recategorizes the original 26 exercises from muscle groups onto the
--      sheet's 8 movement patterns (Push, Pull, Squat, Hinge, Shoulders,
--      Arms, Core, Calves), matched one to one by Loom video.
--   3. Inserts the 37 exercises that are new in the sheet, with no cue.
--      "Hip Thrust" (sheet row 41) is inserted with no video: that row reuses
--      the Glute Bridge clip by mistake and real footage does not exist yet.

begin;

-- 1. cue is now optional --------------------------------------------------
alter table exercises alter column cue drop not null;

-- 2. recategorize the original 26 onto movement patterns -----------------
update exercises as e
set category = v.category
from (values
  ('Incline Dumbbell Press', 'Push'),
  ('Pec Fly Machine', 'Push'),
  ('Body Weight Push Up', 'Push'),
  ('Cable Standing Tricep Extension', 'Arms'),
  ('Cuffed Lateral Raise', 'Shoulders'),
  ('Leg Extension Machine', 'Squat'),
  ('Chest Supported Landmine Row', 'Pull'),
  ('Lat Pull Down', 'Pull'),
  ('Preacher Curl Machine', 'Arms'),
  ('Lying Leg Curl Machine', 'Hinge'),
  ('Barbell Shrugs', 'Pull'),
  ('Seated Calf Raise (Leg Press Machine)', 'Calves'),
  ('Seated Hip Adduction Machine', 'Hinge'),
  ('Lying Leg Press Machine', 'Squat'),
  ('Dumbbell Walking Lunges', 'Squat'),
  ('Chest Focused Dips', 'Push'),
  ('Overhead Cable Tricep Extension', 'Arms'),
  ('Dumbbell Lateral Raise', 'Shoulders'),
  ('Shoulder Press Machine', 'Push'),
  ('Incline Lying Dumbbell Bicep Curl', 'Arms'),
  ('Rope Standing Cable Bicep Curl', 'Arms'),
  ('Barbell Row', 'Pull'),
  ('Seated Hip Abduction Machine', 'Hinge'),
  ('Seated Leg Curl Machine', 'Hinge'),
  ('Barbell RDL''s', 'Hinge'),
  ('Hip Thrust Machine', 'Hinge')
) as v(name, category)
where e.name = v.name and e.category <> v.category;

-- 3. insert the new exercises ------------------------------------------
insert into exercises (name, category, cue, video_url) values ('Back Squat', 'Squat', null, 'https://www.loom.com/share/41f88c0ebac84e82b315337cb4d38f33')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Goblet Squat', 'Squat', null, 'https://www.loom.com/share/f0bd50da822c414a9bf02cdbe9464f68')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Bodyweight Squat', 'Squat', null, 'https://www.loom.com/share/5ccb219f040246849d8d571b431921be')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Jump Squat', 'Squat', null, 'https://www.loom.com/share/7a7168ac40574beaba3124805fdffc5c')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Split Squat', 'Squat', null, 'https://www.loom.com/share/38e423b918d244a384215e2d67214a3c')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Bulgarian Split Squat', 'Squat', null, 'https://www.loom.com/share/edd2ca4b8a93435e94f18220ccd5a3e3')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Bench Press', 'Push', null, 'https://www.loom.com/share/2a6255e415724571bfcca5efc150128b')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('DB Bench Press', 'Push', null, 'https://www.loom.com/share/ed1659d4920d4261ab3888b32dd8dd54')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Decline Push Up', 'Push', null, 'https://www.loom.com/share/139e316b827d448584908d410a2c2377')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Chair Dip', 'Push', null, 'https://www.loom.com/share/fc531969a6ed4c16b0c3b5bd79b294b5')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Pike Push Up', 'Push', null, 'https://www.loom.com/share/c6640034dcca4fa6bf851496bfa22c3e')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('DB Shoulder Press', 'Push', null, 'https://www.loom.com/share/70dbaa13a94347b991e82020d6dd7640')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('DB Romanian Deadlift', 'Hinge', null, 'https://www.loom.com/share/586b85e138f845e88487b8b444098e9f')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Single Leg Romanian Deadlift', 'Hinge', null, 'https://www.loom.com/share/ec488a018ea447c0b8e4d533bd46cece')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Deadlift', 'Hinge', null, 'https://www.loom.com/share/ca1dd49907a2433bb942aa69ef831ee9')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Barbell Good Morning', 'Hinge', null, 'https://www.loom.com/share/45415ac0b3d1489f99748bc1ac1bd292')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Bent Over Row', 'Pull', null, 'https://www.loom.com/share/9b7dd246ed0a4090a23c71c37d5f1b11')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('DB Row (one arm)', 'Pull', null, 'https://www.loom.com/share/40d46a57ae6a4c33be305b29e27a2946')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Inverted Row', 'Pull', null, 'https://www.loom.com/share/72c9d50154d141679994287e2caca38b')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Pull Up', 'Pull', null, 'https://www.loom.com/share/6522956d872c4a018ba2dac840e4130f')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Chin Up', 'Pull', null, 'https://www.loom.com/share/7c812a0ac319453d9f6847bb6de164e2')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Seated Cable Row', 'Pull', null, 'https://www.loom.com/share/4241dc5b7b6548d18c109a60a2a03be8')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Renegade Row', 'Pull', null, 'https://www.loom.com/share/bc426f1fbe594100aaad0167ca1cd18b')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Face Pull', 'Pull', null, 'https://www.loom.com/share/38deee01cc0d4bda8dd2ba7c7ed55e68')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Rear Delt Fly', 'Shoulders', null, 'https://www.loom.com/share/b180a14e8b48435ebc4a150cbf00c801')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Superman Hold', 'Core', null, 'https://www.loom.com/share/3499b4f2794e414182f29061564b3344')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Superman', 'Core', null, 'https://www.loom.com/share/3499b4f2794e414182f29061564b3344')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Back Extension', 'Core', null, 'https://www.loom.com/share/67ebdc33ef524eb18afa6e41ae297519')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Glute Bridge', 'Hinge', null, 'https://www.loom.com/share/e887b24ea9164df1aaa26474dca5575a')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Hip Thrust', 'Hinge', null, null)
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Calf Raise', 'Calves', null, 'https://www.loom.com/share/e83457ded6bb43e5ab320405fd495108')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('DB Calf Raise', 'Calves', null, 'https://www.loom.com/share/94b098a8fd594e0e811a675dedf82d79')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Biceps Curl', 'Arms', null, 'https://www.loom.com/share/a0b6616d331049d29a5263b644c21b33')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Barbell Curl', 'Arms', null, 'https://www.loom.com/share/e06dd3cc69a94cabaf9718e3af69b1e5')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Hammer Curl', 'Arms', null, 'https://www.loom.com/share/71cc67b0733c4fe0b581320fe69fa61d')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Plank', 'Core', null, 'https://www.loom.com/share/68e15714ba7649ab8441e2085fbe8be3')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;
insert into exercises (name, category, cue, video_url) values ('Overhead Triceps Extension (Rope)', 'Arms', null, 'https://www.loom.com/share/6f28a66078e34a56bad971919f029329')
  on conflict (name) do update set category = excluded.category, video_url = excluded.video_url;

commit;
