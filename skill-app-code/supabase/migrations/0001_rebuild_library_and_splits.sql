-- Migration 0001: rebuild the exercise library and training splits
--
-- Run in the Supabase SQL Editor after schema.sql + seed.sql. One
-- transaction, written to be safe to re-run.
--
-- Brings the database in line with the reference app at
-- https://vfqxoqweo8.salvadorskfitness.com:
--   1. exercises gain muscle + equipment, cue becomes instructions, the
--      old movement-pattern category column is dropped. All 63 exercises
--      get the reference muscle group, equipment and coaching text.
--   2. New tables model reusable training days: day_templates (each with a
--      Full Gym / Dumbbells / Bodyweight variant), splits, split_days.
--   3. The 4 reference splits are seeded as the primary section; the 2
--      Superman programs are carried into the coached section.
--   4. workout_sessions gains split_id / day_template_id / variant so a
--      logged session remembers where it came from.

begin;

-- 1. reshape exercises ----------------------------------------------------
alter table exercises add column if not exists muscle text;
alter table exercises add column if not exists equipment text;
alter table exercises alter column cue drop not null;
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'exercises' and column_name = 'cue') then
    alter table exercises rename column cue to instructions;
  end if;
end $$;
-- drop the old movement-pattern column now, before the inserts below
-- (which do not provide it).
alter table exercises drop column if exists category;

-- 2a. rename and refresh the 26 exercises already present, matched by
--     Loom video, so their id (and any workout history) is preserved.
update exercises set name = 'Incline DB Press', muscle = 'Chest', equipment = 'Dumbbell', instructions = 'Set bench to 30°, press dumbbells up and slightly together, control the descent.', video_url = 'https://www.loom.com/share/02e642695ac748c5ae8f3edb2ca2c60c' where name = 'Incline Dumbbell Press';
update exercises set name = 'Pec Fly Machine', muscle = 'Chest', equipment = 'Machine', instructions = 'Back against pad, bring handles together in a wide arc, slight bend in elbows, squeeze chest at the top.', video_url = 'https://www.loom.com/share/bd19ddcac4ad4ea18798f936bc07b366' where name = 'Pec Fly Machine';
update exercises set name = 'Push Up', muscle = 'Chest', equipment = 'Bodyweight', instructions = 'Keep core tight, lower chest to floor, push through palms to full extension.', video_url = 'https://www.loom.com/share/cea8dda8a6ad451e9539d2a2a285f2a3' where name = 'Body Weight Push Up';
update exercises set name = 'Triceps Pushdown', muscle = 'Arms', equipment = 'Cable', instructions = 'Elbows tight, push bar down, full tricep contraction, control the return.', video_url = 'https://www.loom.com/share/d36c11634e2944cab3cd1d1f834a80d2' where name = 'Cable Standing Tricep Extension';
update exercises set name = 'Cuffed Lateral Raise', muscle = 'Shoulders', equipment = 'Cable', instructions = 'Cuffs on wrists at low cable, raise arms out to sides to shoulder height, slight bend in elbows, lead with delts.', video_url = 'https://www.loom.com/share/3364eac20d7d46adb1696e617dad6645' where name = 'Cuffed Lateral Raise';
update exercises set name = 'Leg Extension', muscle = 'Legs', equipment = 'Machine', instructions = 'Sit tall, extend knees to straight, squeeze quads, control the lower.', video_url = 'https://www.loom.com/share/97db6ded80094e2f856461bce6538c3d' where name = 'Leg Extension Machine';
update exercises set name = 'Chest Supported Landmine Row', muscle = 'Back', equipment = 'Barbell', instructions = 'Chest down on incline bench facing landmine, pull bar to chest keeping elbows close, lower with control.', video_url = 'https://www.loom.com/share/9af97f79d35b4457946f220aa1c489e7' where name = 'Chest Supported Landmine Row';
update exercises set name = 'Lat Pulldown', muscle = 'Back', equipment = 'Cable', instructions = 'Pull bar to upper chest, control the negative, full stretch at top.', video_url = 'https://www.loom.com/share/61191122b69341acbf44750fabde545d' where name = 'Lat Pull Down';
update exercises set name = 'Preacher Curl Machine', muscle = 'Arms', equipment = 'Machine', instructions = 'Arms on pad, palms up, curl to full contraction, slow negative.', video_url = 'https://www.loom.com/share/de6f8ee687e6422aa34dc0b8410740e0' where name = 'Preacher Curl Machine';
update exercises set name = 'Lying Leg Curl Machine', muscle = 'Legs', equipment = 'Machine', instructions = 'Face down, ankles under pad, curl heels toward glutes, lower with control.', video_url = 'https://www.loom.com/share/a6f55b1ae62a41749eb224b346e9fba8' where name = 'Lying Leg Curl Machine';
update exercises set name = 'Barbell Shrugs', muscle = 'Back', equipment = 'Barbell', instructions = 'Barbell at thighs, shrug shoulders straight up, brief hold at top, slow lower.', video_url = 'https://www.loom.com/share/0f2d5b8f409141a9b12abed80b8b1dff' where name = 'Barbell Shrugs';
update exercises set name = 'Seated Calf Raise (Leg Press Machine)', muscle = 'Legs', equipment = 'Machine', instructions = 'Toes on lower edge of footplate, heels hanging off, push through toes to lift heels, slow lower.', video_url = 'https://www.loom.com/share/e63061c2d61841f9813e4c8607e81d18' where name = 'Seated Calf Raise (Leg Press Machine)';
update exercises set name = 'Seated Hip Adduction Machine', muscle = 'Legs', equipment = 'Machine', instructions = 'Thighs against inner pads, squeeze legs together, slow return.', video_url = 'https://www.loom.com/share/5e96e996bc3b42c5a91b8f97c65576bb' where name = 'Seated Hip Adduction Machine';
update exercises set name = 'Leg Press', muscle = 'Legs', equipment = 'Machine', instructions = 'Feet shoulder-width, lower platform to 90°, press without locking knees.', video_url = 'https://www.loom.com/share/1bfe00452d004cb68d2b02e540b2e954' where name = 'Lying Leg Press Machine';
update exercises set name = 'Walking Lunge', muscle = 'Legs', equipment = 'Dumbbell', instructions = 'Step forward, drop back knee, push through front heel to next step.', video_url = 'https://www.loom.com/share/a3c123f6f29542999a0feba5b7edc897' where name = 'Dumbbell Walking Lunges';
update exercises set name = 'Dips', muscle = 'Arms', equipment = 'Bodyweight', instructions = 'Support on parallel bars, lower until shoulders below elbows, press up.', video_url = 'https://www.loom.com/share/8c069936fa324d11bc4c1ec1abead960' where name = 'Chest Focused Dips';
update exercises set name = 'Overhead Triceps Extension', muscle = 'Arms', equipment = 'Dumbbell', instructions = 'Dumbbell overhead, lower behind head keeping elbows in, extend back up.', video_url = 'https://www.loom.com/share/6f28a66078e34a56bad971919f029329' where name = 'Overhead Cable Tricep Extension';
update exercises set name = 'Lateral Raise', muscle = 'Shoulders', equipment = 'Dumbbell', instructions = 'Slight elbow bend, raise to shoulder height, lead with elbows, slow lower.', video_url = 'https://www.loom.com/share/15a88578ee5a4eb6ba48ea3895e67978' where name = 'Dumbbell Lateral Raise';
update exercises set name = 'Overhead Press', muscle = 'Shoulders', equipment = 'Barbell', instructions = 'Bar at shoulders, brace, press overhead to full lockout, lower to chin.', video_url = 'https://www.loom.com/share/e67e0bc924d4465cb791dded4bc06efd' where name = 'Shoulder Press Machine';
update exercises set name = 'Incline Lying Dumbbell Bicep Curl', muscle = 'Arms', equipment = 'Dumbbell', instructions = 'Lie back on incline bench, palms up, curl to shoulders keeping elbows still, slow lower.', video_url = 'https://www.loom.com/share/f150f7cfde1b469f85ce7a0a0f0c1e40' where name = 'Incline Lying Dumbbell Bicep Curl';
update exercises set name = 'Rope Standing Cable Bicep Curl', muscle = 'Arms', equipment = 'Cable', instructions = 'Rope on low pulley, palms facing in, curl to shoulders with elbows fixed, slow lower.', video_url = 'https://www.loom.com/share/6ba8358f474346a09e4bea5e404b7cb7' where name = 'Rope Standing Cable Bicep Curl';
update exercises set name = 'Barbell Row', muscle = 'Back', equipment = 'Barbell', instructions = 'Hinge forward, pull bar to lower ribs, squeeze shoulder blades.', video_url = 'https://www.loom.com/share/0604db8d842d48f689da9cf966635c2d' where name = 'Barbell Row';
update exercises set name = 'Seated Hip Abduction Machine', muscle = 'Legs', equipment = 'Machine', instructions = 'Legs inside pads, push outward against resistance, slow return.', video_url = 'https://www.loom.com/share/c4f996625c704926a3440648d3f953b0' where name = 'Seated Hip Abduction Machine';
update exercises set name = 'Leg Curl', muscle = 'Legs', equipment = 'Machine', instructions = 'Curl heels toward glutes, squeeze hamstrings, control the return.', video_url = 'https://www.loom.com/share/13bf708413874b829d75f89295937c3a' where name = 'Seated Leg Curl Machine';
update exercises set name = 'Romanian Deadlift', muscle = 'Legs', equipment = 'Barbell', instructions = 'Soft knees, hinge at hips, lower bar along thighs, drive hips forward.', video_url = 'https://www.loom.com/share/5d2d19a51b6843bab4bd7513de818b87' where name = 'Barbell RDL''s';
update exercises set name = 'Hip Thrust Machine', muscle = 'Legs', equipment = 'Machine', instructions = 'Upper back against pad, feet flat on platform, drive through heels to extend hips, squeeze glutes at top, lower with control.', video_url = 'https://www.loom.com/share/79436bc6480643afac233aeb48ea248c' where name = 'Hip Thrust Machine';

-- 2b. insert the 37 new exercises.
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Back Squat', 'Legs', 'Barbell', 'Bar on upper traps, brace core, descend to depth, drive through midfoot.', 'https://www.loom.com/share/41f88c0ebac84e82b315337cb4d38f33')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Goblet Squat', 'Legs', 'Dumbbell', 'Hold one dumbbell at chest, squat down between knees, keep torso tall.', 'https://www.loom.com/share/f0bd50da822c414a9bf02cdbe9464f68')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Bodyweight Squat', 'Legs', 'Bodyweight', 'Feet shoulder-width, sit back into hips, knees track over toes, stand tall.', 'https://www.loom.com/share/5ccb219f040246849d8d571b431921be')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Jump Squat', 'Legs', 'Bodyweight', 'Squat down, then explode upward, land soft and reset into next rep.', 'https://www.loom.com/share/7a7168ac40574beaba3124805fdffc5c')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Split Squat', 'Legs', 'Bodyweight', 'Staggered stance, drop straight down, front thigh to parallel, drive up.', 'https://www.loom.com/share/38e423b918d244a384215e2d67214a3c')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Bulgarian Split Squat', 'Legs', 'Bodyweight', 'Rear foot elevated, drop front knee down, keep chest tall, drive through front heel.', 'https://www.loom.com/share/edd2ca4b8a93435e94f18220ccd5a3e3')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Bench Press', 'Chest', 'Barbell', 'Lie flat, grip slightly wider than shoulders, lower bar to mid-chest, press up.', 'https://www.loom.com/share/2a6255e415724571bfcca5efc150128b')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('DB Bench Press', 'Chest', 'Dumbbell', 'Press dumbbells up and slightly together, control the descent to chest.', 'https://www.loom.com/share/ed1659d4920d4261ab3888b32dd8dd54')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Decline Push Up', 'Chest', 'Bodyweight', 'Feet elevated on a surface, lower chest to floor, press up through palms.', 'https://www.loom.com/share/139e316b827d448584908d410a2c2377')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Chair Dip', 'Arms', 'Bodyweight', 'Hands on chair edge behind you, lower hips toward floor, press through palms.', 'https://www.loom.com/share/fc531969a6ed4c16b0c3b5bd79b294b5')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Pike Push Up', 'Shoulders', 'Bodyweight', 'Hips high in pike position, lower crown of head toward floor, press back up.', 'https://www.loom.com/share/c6640034dcca4fa6bf851496bfa22c3e')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('DB Shoulder Press', 'Shoulders', 'Dumbbell', 'Dumbbells at shoulders, press overhead to lockout, control the descent.', 'https://www.loom.com/share/70dbaa13a94347b991e82020d6dd7640')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('DB Romanian Deadlift', 'Legs', 'Dumbbell', 'Dumbbells at thighs, hinge at hips with soft knees, lower along legs, drive hips.', 'https://www.loom.com/share/586b85e138f845e88487b8b444098e9f')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Single Leg Romanian Deadlift', 'Legs', 'Dumbbell', 'Hinge on one leg, lower dumbbell toward floor, keep hips square, return tall.', 'https://www.loom.com/share/ec488a018ea447c0b8e4d533bd46cece')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Deadlift', 'Back', 'Barbell', 'Hip hinge, neutral spine, drive through floor, lock out hips at the top.', 'https://www.loom.com/share/ca1dd49907a2433bb942aa69ef831ee9')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Barbell Good Morning', 'Legs', 'Barbell', 'Bar on traps, soft knees, hinge forward at hips keeping back flat, return tall.', 'https://www.loom.com/share/45415ac0b3d1489f99748bc1ac1bd292')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Bent Over Row', 'Back', 'Barbell', 'Hinge forward, pull bar to lower ribs, squeeze shoulder blades, control down.', 'https://www.loom.com/share/9b7dd246ed0a4090a23c71c37d5f1b11')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('DB Row (one arm)', 'Back', 'Dumbbell', 'One hand on bench, row dumbbell to hip, squeeze back, control the lower.', 'https://www.loom.com/share/40d46a57ae6a4c33be305b29e27a2946')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Inverted Row', 'Back', 'Bodyweight', 'Hang under a bar, body straight, pull chest to bar, lower with control.', 'https://www.loom.com/share/72c9d50154d141679994287e2caca38b')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Pull Up', 'Back', 'Bodyweight', 'Hang with straight arms, pull chest to bar, lower with control.', 'https://www.loom.com/share/6522956d872c4a018ba2dac840e4130f')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Chin Up', 'Back', 'Bodyweight', 'Supinated grip, pull chin over bar, lower with control to full hang.', 'https://www.loom.com/share/7c812a0ac319453d9f6847bb6de164e2')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Seated Cable Row', 'Back', 'Cable', 'Sit tall, pull handle to torso, squeeze back, control the return.', 'https://www.loom.com/share/4241dc5b7b6548d18c109a60a2a03be8')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Renegade Row', 'Back', 'Dumbbell', 'Plank on dumbbells, row one up to hip, keep hips square, alternate sides.', 'https://www.loom.com/share/bc426f1fbe594100aaad0167ca1cd18b')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Face Pull', 'Shoulders', 'Cable', 'Pull rope to forehead, externally rotate, squeeze rear delts.', 'https://www.loom.com/share/38deee01cc0d4bda8dd2ba7c7ed55e68')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Rear Delt Fly', 'Shoulders', 'Dumbbell', 'Hinge forward, raise dumbbells out to sides, lead with elbows, slow lower.', 'https://www.loom.com/share/b180a14e8b48435ebc4a150cbf00c801')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Superman Hold', 'Back', 'Bodyweight', 'Lie prone, lift arms and legs off floor, hold at top, lower with control.', 'https://www.loom.com/share/3499b4f2794e414182f29061564b3344')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Superman', 'Back', 'Bodyweight', 'Lie prone, lift arms and legs, lower and repeat for reps.', 'https://www.loom.com/share/3499b4f2794e414182f29061564b3344')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Back Extension', 'Back', 'Bodyweight', 'On extension bench, hinge at hips, raise torso to neutral, lower with control.', 'https://www.loom.com/share/67ebdc33ef524eb18afa6e41ae297519')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Glute Bridge', 'Legs', 'Bodyweight', 'Lie on back, drive hips up through heels, squeeze glutes, lower down.', 'https://www.loom.com/share/e887b24ea9164df1aaa26474dca5575a')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Hip Thrust', 'Legs', 'Barbell', 'Upper back on bench, bar over hips, drive up, squeeze glutes, lower.', null)
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Calf Raise', 'Legs', 'Bodyweight', 'Rise onto toes as high as possible, pause, lower under control.', 'https://www.loom.com/share/e83457ded6bb43e5ab320405fd495108')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('DB Calf Raise', 'Legs', 'Dumbbell', 'Hold dumbbells, rise onto toes, pause at top, lower with control.', 'https://www.loom.com/share/94b098a8fd594e0e811a675dedf82d79')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Standing Bicep Curl', 'Arms', 'Dumbbell', 'Stand tall, elbows pinned to sides, curl dumbbells up, slow negative, full extension at bottom.', 'https://www.loom.com/share/6872de48696c4cada7285d958d1789e0')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Cable BAR Bicep Curl', 'Arms', 'Cable', 'Attach bar to low pulley, elbows pinned to sides, curl up, slow negative, full extension at bottom.', 'https://www.loom.com/share/a0b6616d331049d29a5263b644c21b33')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Barbell Curl', 'Arms', 'Barbell', 'Elbows pinned to sides, curl bar up, squeeze biceps, slow lower.', 'https://www.loom.com/share/e06dd3cc69a94cabaf9718e3af69b1e5')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Hammer Curl', 'Arms', 'Dumbbell', 'Neutral grip, curl up keeping wrists straight, slow eccentric.', 'https://www.loom.com/share/71cc67b0733c4fe0b581320fe69fa61d')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;
insert into exercises (name, muscle, equipment, instructions, video_url) values ('Plank', 'Core', 'Bodyweight', 'Forearms down, body straight line, brace abs and glutes, hold.', 'https://www.loom.com/share/68e15714ba7649ab8441e2085fbe8be3')
  on conflict (name) do update set muscle = excluded.muscle, equipment = excluded.equipment, instructions = excluded.instructions, video_url = excluded.video_url;

-- 2c. every exercise now has a muscle group; make it required.
alter table exercises alter column muscle set not null;

-- 3. training day + split model ----------------------------------------
create table if not exists day_templates (
  id text primary key,
  name text not null,
  focus text,
  description text
);

create table if not exists day_template_exercises (
  id uuid primary key default gen_random_uuid(),
  day_template_id text not null references day_templates(id) on delete cascade,
  variant text not null default 'Full Gym',
  position integer not null,
  exercise_id uuid not null references exercises(id) on delete restrict,
  sets integer not null,
  reps text not null,
  unique (day_template_id, variant, position)
);

create table if not exists splits (
  id text primary key,
  name text not null,
  cadence text not null,
  description text,
  section text not null default 'primary',
  position integer not null
);

create table if not exists split_days (
  id uuid primary key default gen_random_uuid(),
  split_id text not null references splits(id) on delete cascade,
  position integer not null,
  day_template_id text not null references day_templates(id) on delete restrict,
  label text,
  unique (split_id, position)
);

create index if not exists day_template_exercises_idx on day_template_exercises(day_template_id, variant, position);
create index if not exists split_days_idx on split_days(split_id, position);

alter table workout_sessions add column if not exists split_id text references splits(id) on delete set null;
alter table workout_sessions add column if not exists day_template_id text references day_templates(id) on delete set null;
alter table workout_sessions add column if not exists variant text;

-- optional lightweight note against one exercise in a session (stored on
-- its first set). The main per-session note stays on workout_sessions.notes.
alter table workout_sets add column if not exists note text;

-- 4. RLS: new reference tables readable by any signed-in user ----------
alter table day_templates enable row level security;
drop policy if exists "day_templates readable by authenticated users" on day_templates;
create policy "day_templates readable by authenticated users" on day_templates for select to authenticated using (true);
alter table day_template_exercises enable row level security;
drop policy if exists "day_template_exercises readable by authenticated users" on day_template_exercises;
create policy "day_template_exercises readable by authenticated users" on day_template_exercises for select to authenticated using (true);
alter table splits enable row level security;
drop policy if exists "splits readable by authenticated users" on splits;
create policy "splits readable by authenticated users" on splits for select to authenticated using (true);
alter table split_days enable row level security;
drop policy if exists "split_days readable by authenticated users" on split_days;
create policy "split_days readable by authenticated users" on split_days for select to authenticated using (true);

-- 5. seed the 4 reference splits (primary section) --------------------
delete from day_template_exercises where day_template_id in ('full-body', 'upper', 'lower', 'push', 'pull', 'legs');

insert into day_templates (id, name, focus, description) values ('full-body', 'Full Body', 'Whole-body strength', 'Hits every major muscle group in one session. Ideal 2-3x per week.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 0, e.id, 4, '6-8' from exercises e where e.name = 'Back Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 1, e.id, 4, '6-8' from exercises e where e.name = 'Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 2, e.id, 4, '8-10' from exercises e where e.name = 'Bent Over Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 3, e.id, 3, '8-10' from exercises e where e.name = 'Overhead Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 4, e.id, 3, '8-10' from exercises e where e.name = 'Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Full Gym', 5, e.id, 3, '30-45s' from exercises e where e.name = 'Plank';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 0, e.id, 4, '8-10' from exercises e where e.name = 'Goblet Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 1, e.id, 4, '8-10' from exercises e where e.name = 'DB Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 2, e.id, 4, '10-12' from exercises e where e.name = 'DB Row (one arm)';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 3, e.id, 3, '10-12' from exercises e where e.name = 'DB Shoulder Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 4, e.id, 3, '10-12' from exercises e where e.name = 'DB Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Dumbbells', 5, e.id, 3, '30-45s' from exercises e where e.name = 'Plank';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 0, e.id, 4, '15-20' from exercises e where e.name = 'Bodyweight Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 1, e.id, 4, '12-15' from exercises e where e.name = 'Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 2, e.id, 4, '10-12' from exercises e where e.name = 'Inverted Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 3, e.id, 3, '10-12' from exercises e where e.name = 'Pike Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 4, e.id, 3, '10-12' from exercises e where e.name = 'Single Leg Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'full-body', 'Bodyweight', 5, e.id, 3, '30-45s' from exercises e where e.name = 'Plank';

insert into day_templates (id, name, focus, description) values ('upper', 'Upper Body', 'Chest · Back · Shoulders · Arms', 'All upper-body pushing and pulling in one focused session.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 0, e.id, 4, '6-8' from exercises e where e.name = 'Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 1, e.id, 4, '8-10' from exercises e where e.name = 'Barbell Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 2, e.id, 4, '8-10' from exercises e where e.name = 'Overhead Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 3, e.id, 3, '10-12' from exercises e where e.name = 'Lat Pulldown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 4, e.id, 3, '10-12' from exercises e where e.name = 'Triceps Pushdown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Full Gym', 5, e.id, 3, '10-12' from exercises e where e.name = 'Barbell Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 0, e.id, 4, '8-10' from exercises e where e.name = 'DB Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 1, e.id, 4, '10-12' from exercises e where e.name = 'DB Row (one arm)';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 2, e.id, 4, '10-12' from exercises e where e.name = 'DB Shoulder Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 3, e.id, 3, '10-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 4, e.id, 3, '12-15' from exercises e where e.name = 'Standing Bicep Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Dumbbells', 5, e.id, 3, '12-15' from exercises e where e.name = 'Overhead Triceps Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 0, e.id, 4, '12-15' from exercises e where e.name = 'Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 1, e.id, 4, '6-10' from exercises e where e.name = 'Pull Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 2, e.id, 3, '10-12' from exercises e where e.name = 'Pike Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 3, e.id, 3, '12-15' from exercises e where e.name = 'Chair Dip';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 4, e.id, 3, '6-10' from exercises e where e.name = 'Chin Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'upper', 'Bodyweight', 5, e.id, 3, '10-12' from exercises e where e.name = 'Decline Push Up';

insert into day_templates (id, name, focus, description) values ('lower', 'Lower Body', 'Quads · Hamstrings · Glutes · Calves', 'Build strength and size from the hips down.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 0, e.id, 4, '6-8' from exercises e where e.name = 'Back Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 1, e.id, 4, '8-10' from exercises e where e.name = 'Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 2, e.id, 3, '10-12' from exercises e where e.name = 'Leg Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 3, e.id, 3, '12-15' from exercises e where e.name = 'Leg Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 4, e.id, 3, '10-12' from exercises e where e.name = 'Hip Thrust';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Full Gym', 5, e.id, 4, '15-20' from exercises e where e.name = 'Calf Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Dumbbells', 0, e.id, 4, '8-10' from exercises e where e.name = 'Goblet Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Dumbbells', 1, e.id, 4, '10-12' from exercises e where e.name = 'DB Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Dumbbells', 2, e.id, 3, '10-12' from exercises e where e.name = 'Walking Lunge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Dumbbells', 3, e.id, 4, '15-20' from exercises e where e.name = 'DB Calf Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Dumbbells', 4, e.id, 3, '12-15' from exercises e where e.name = 'Glute Bridge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 0, e.id, 4, '15-20' from exercises e where e.name = 'Bodyweight Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 1, e.id, 3, '10-12' from exercises e where e.name = 'Bulgarian Split Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 2, e.id, 3, '10-12' from exercises e where e.name = 'Single Leg Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 3, e.id, 3, '15-20' from exercises e where e.name = 'Glute Bridge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 4, e.id, 3, '12-15' from exercises e where e.name = 'Jump Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'lower', 'Bodyweight', 5, e.id, 4, '15-20' from exercises e where e.name = 'Calf Raise';

insert into day_templates (id, name, focus, description) values ('push', 'Push Day', 'Chest · Shoulders · Triceps', 'All pressing movements, the first half of a push/pull/legs split.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 0, e.id, 4, '6-8' from exercises e where e.name = 'Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 1, e.id, 4, '8-10' from exercises e where e.name = 'Overhead Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 2, e.id, 3, '10-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 3, e.id, 3, '10-12' from exercises e where e.name = 'Triceps Pushdown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 4, e.id, 3, '12-15' from exercises e where e.name = 'Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Full Gym', 5, e.id, 3, '8-12' from exercises e where e.name = 'Dips';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Dumbbells', 0, e.id, 4, '8-10' from exercises e where e.name = 'DB Bench Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Dumbbells', 1, e.id, 4, '10-12' from exercises e where e.name = 'DB Shoulder Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Dumbbells', 2, e.id, 3, '10-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Dumbbells', 3, e.id, 3, '12-15' from exercises e where e.name = 'Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Dumbbells', 4, e.id, 3, '12-15' from exercises e where e.name = 'Overhead Triceps Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Bodyweight', 0, e.id, 4, '12-15' from exercises e where e.name = 'Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Bodyweight', 1, e.id, 4, '10-12' from exercises e where e.name = 'Pike Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Bodyweight', 2, e.id, 3, '10-12' from exercises e where e.name = 'Decline Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Bodyweight', 3, e.id, 3, '12-15' from exercises e where e.name = 'Chair Dip';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'push', 'Bodyweight', 4, e.id, 3, '8-12' from exercises e where e.name = 'Dips';

insert into day_templates (id, name, focus, description) values ('pull', 'Pull Day', 'Back · Biceps · Rear Delts', 'Pulling movements, the second half of a push/pull/legs split.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 0, e.id, 4, '5-6' from exercises e where e.name = 'Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 1, e.id, 4, '8-10' from exercises e where e.name = 'Barbell Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 2, e.id, 3, '10-12' from exercises e where e.name = 'Lat Pulldown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 3, e.id, 3, '10-12' from exercises e where e.name = 'Seated Cable Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 4, e.id, 3, '12-15' from exercises e where e.name = 'Face Pull';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Full Gym', 5, e.id, 3, '10-12' from exercises e where e.name = 'Barbell Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Dumbbells', 0, e.id, 4, '10-12' from exercises e where e.name = 'DB Row (one arm)';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Dumbbells', 1, e.id, 3, '10-12' from exercises e where e.name = 'Renegade Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Dumbbells', 2, e.id, 3, '12-15' from exercises e where e.name = 'Rear Delt Fly';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Dumbbells', 3, e.id, 3, '12-15' from exercises e where e.name = 'Standing Bicep Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Dumbbells', 4, e.id, 3, '12-15' from exercises e where e.name = 'Hammer Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Bodyweight', 0, e.id, 4, '6-10' from exercises e where e.name = 'Pull Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Bodyweight', 1, e.id, 4, '10-12' from exercises e where e.name = 'Inverted Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Bodyweight', 2, e.id, 3, '6-10' from exercises e where e.name = 'Chin Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Bodyweight', 3, e.id, 3, '20-30s' from exercises e where e.name = 'Superman Hold';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'pull', 'Bodyweight', 4, e.id, 3, '12-15' from exercises e where e.name = 'Back Extension';

insert into day_templates (id, name, focus, description) values ('legs', 'Legs Day', 'Quads · Hamstrings · Glutes · Calves', 'Dedicated lower-body day to finish a push/pull/legs split.')
  on conflict (id) do update set name = excluded.name, focus = excluded.focus, description = excluded.description;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 0, e.id, 4, '6-8' from exercises e where e.name = 'Back Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 1, e.id, 4, '8-10' from exercises e where e.name = 'Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 2, e.id, 3, '10-12' from exercises e where e.name = 'Leg Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 3, e.id, 3, '12-15' from exercises e where e.name = 'Leg Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 4, e.id, 3, '12-15' from exercises e where e.name = 'Leg Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Full Gym', 5, e.id, 4, '15-20' from exercises e where e.name = 'Calf Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Dumbbells', 0, e.id, 4, '8-10' from exercises e where e.name = 'Goblet Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Dumbbells', 1, e.id, 4, '10-12' from exercises e where e.name = 'DB Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Dumbbells', 2, e.id, 3, '10-12' from exercises e where e.name = 'Walking Lunge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Dumbbells', 3, e.id, 4, '15-20' from exercises e where e.name = 'DB Calf Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Dumbbells', 4, e.id, 3, '12-15' from exercises e where e.name = 'Glute Bridge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 0, e.id, 4, '15-20' from exercises e where e.name = 'Bodyweight Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 1, e.id, 3, '10-12' from exercises e where e.name = 'Bulgarian Split Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 2, e.id, 3, '10-12' from exercises e where e.name = 'Single Leg Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 3, e.id, 3, '12-15' from exercises e where e.name = 'Jump Squat';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 4, e.id, 3, '15-20' from exercises e where e.name = 'Glute Bridge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'legs', 'Bodyweight', 5, e.id, 4, '15-20' from exercises e where e.name = 'Calf Raise';

insert into splits (id, name, cadence, description, section, position) values ('full-body', 'Full Body', '2-3x per week', 'One full-body session repeated 2-3 times per week. No day numbering needed.', 'primary', 0)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'full-body';
insert into split_days (split_id, position, day_template_id) values ('full-body', 0, 'full-body');

insert into splits (id, name, cadence, description, section, position) values ('upper-lower', 'Upper Lower', '4 days', 'Alternates upper and lower days across four sessions.', 'primary', 1)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'upper-lower';
insert into split_days (split_id, position, day_template_id) values ('upper-lower', 0, 'upper');
insert into split_days (split_id, position, day_template_id) values ('upper-lower', 1, 'lower');
insert into split_days (split_id, position, day_template_id) values ('upper-lower', 2, 'upper');
insert into split_days (split_id, position, day_template_id) values ('upper-lower', 3, 'lower');

insert into splits (id, name, cadence, description, section, position) values ('ppl-ul', 'Push Pull Legs + Upper Lower', '5 days', 'Push, Pull, Legs followed by an Upper and Lower day to round out the week.', 'primary', 2)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'ppl-ul';
insert into split_days (split_id, position, day_template_id) values ('ppl-ul', 0, 'push');
insert into split_days (split_id, position, day_template_id) values ('ppl-ul', 1, 'pull');
insert into split_days (split_id, position, day_template_id) values ('ppl-ul', 2, 'legs');
insert into split_days (split_id, position, day_template_id) values ('ppl-ul', 3, 'upper');
insert into split_days (split_id, position, day_template_id) values ('ppl-ul', 4, 'lower');

insert into splits (id, name, cadence, description, section, position) values ('ppl-x2', 'Push Pull Legs x2', '6 days', 'Push, Pull, Legs run twice across six sessions.', 'primary', 3)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'ppl-x2';
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 0, 'push');
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 1, 'pull');
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 2, 'legs');
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 3, 'push');
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 4, 'pull');
insert into split_days (split_id, position, day_template_id) values ('ppl-x2', 5, 'legs');

-- 6. carry the 2 Superman programs into the coached section ----------
-- Each Superman day becomes a single-variant ('Standard') day template.

-- Superman 6-Day Split
delete from day_template_exercises where day_template_id in ('sm-6-mon', 'sm-6-tue', 'sm-6-wed', 'sm-6-thu', 'sm-6-fri', 'sm-6-sat');
insert into day_templates (id, name, focus, description) values ('sm-6-mon', 'Chest & Push', 'MON . Push A', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 1, e.id, 3, '8-12' from exercises e where e.name = 'Pec Fly Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 3, e.id, 3, '12-15' from exercises e where e.name = 'Triceps Pushdown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Cuffed Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-mon', 'Standard', 5, e.id, 2, '8-12' from exercises e where e.name = 'Leg Extension';

insert into day_templates (id, name, focus, description) values ('sm-6-tue', 'Back & Pull', 'TUE . Pull A', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-tue', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Chest Supported Landmine Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-tue', 'Standard', 1, e.id, 2, '8-12' from exercises e where e.name = 'Lat Pulldown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-tue', 'Standard', 2, e.id, 3, '12-15' from exercises e where e.name = 'Preacher Curl Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-tue', 'Standard', 3, e.id, 2, '8-12' from exercises e where e.name = 'Lying Leg Curl Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-tue', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Barbell Shrugs';

insert into day_templates (id, name, focus, description) values ('sm-6-wed', 'Quads & Legs', 'WED . Legs', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-wed', 'Standard', 0, e.id, 2, '12-15' from exercises e where e.name = 'Seated Calf Raise (Leg Press Machine)';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-wed', 'Standard', 1, e.id, 2, '12-15' from exercises e where e.name = 'Seated Hip Adduction Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-wed', 'Standard', 2, e.id, 3, '8-12' from exercises e where e.name = 'Leg Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-wed', 'Standard', 3, e.id, 2, '8-12' from exercises e where e.name = 'Leg Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-wed', 'Standard', 4, e.id, 2, '8-12' from exercises e where e.name = 'Walking Lunge';

insert into day_templates (id, name, focus, description) values ('sm-6-thu', 'Triceps & Push', 'THU . Push B', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Dips';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 1, e.id, 2, '12-15' from exercises e where e.name = 'Triceps Pushdown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 2, e.id, 2, '12-15' from exercises e where e.name = 'Overhead Triceps Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 3, e.id, 2, '8-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-thu', 'Standard', 5, e.id, 2, '8-12' from exercises e where e.name = 'Overhead Press';

insert into day_templates (id, name, focus, description) values ('sm-6-fri', 'Biceps & Pull', 'FRI . Pull B', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-fri', 'Standard', 0, e.id, 2, '12-15' from exercises e where e.name = 'Preacher Curl Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-fri', 'Standard', 1, e.id, 2, '12-15' from exercises e where e.name = 'Incline Lying Dumbbell Bicep Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-fri', 'Standard', 2, e.id, 2, '12-15' from exercises e where e.name = 'Rope Standing Cable Bicep Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-fri', 'Standard', 3, e.id, 2, '12-15' from exercises e where e.name = 'Barbell Shrugs';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-fri', 'Standard', 4, e.id, 2, '8-12' from exercises e where e.name = 'Barbell Row';

insert into day_templates (id, name, focus, description) values ('sm-6-sat', 'Shoulders, Hams & Glutes', 'SAT . Accessory', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-sat', 'Standard', 0, e.id, 2, '12-15' from exercises e where e.name = 'Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-sat', 'Standard', 1, e.id, 2, '12-15' from exercises e where e.name = 'Seated Hip Abduction Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-sat', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Leg Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-sat', 'Standard', 3, e.id, 2, '8-12' from exercises e where e.name = 'Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-6-sat', 'Standard', 4, e.id, 2, '8-12' from exercises e where e.name = 'Hip Thrust Machine';

insert into splits (id, name, cadence, description, section, position) values ('superman-6', 'Superman 6-Day Split', '6 days', 'Six days a week, split by muscle group: push, pull, legs, push, pull, and a shoulders/hams/glutes finisher.', 'coached', 100)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'superman-6';
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 0, 'sm-6-mon', 'MON');
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 1, 'sm-6-tue', 'TUE');
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 2, 'sm-6-wed', 'WED');
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 3, 'sm-6-thu', 'THU');
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 4, 'sm-6-fri', 'FRI');
insert into split_days (split_id, position, day_template_id, label) values ('superman-6', 5, 'sm-6-sat', 'SAT');

-- Superman 5-Day Split
delete from day_template_exercises where day_template_id in ('sm-5-push', 'sm-5-pull', 'sm-5-legs', 'sm-5-upper', 'sm-5-lower');
insert into day_templates (id, name, focus, description) values ('sm-5-push', 'Push', 'DAY 1 . Chest, Shoulders & Triceps', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Incline DB Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 1, e.id, 3, '8-12' from exercises e where e.name = 'Pec Fly Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Overhead Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 3, e.id, 3, '12-15' from exercises e where e.name = 'Triceps Pushdown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Overhead Triceps Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-push', 'Standard', 5, e.id, 2, '12-15' from exercises e where e.name = 'Cuffed Lateral Raise';

insert into day_templates (id, name, focus, description) values ('sm-5-pull', 'Pull', 'DAY 2 . Back & Biceps', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-pull', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Chest Supported Landmine Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-pull', 'Standard', 1, e.id, 2, '8-12' from exercises e where e.name = 'Lat Pulldown';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-pull', 'Standard', 2, e.id, 3, '12-15' from exercises e where e.name = 'Preacher Curl Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-pull', 'Standard', 3, e.id, 2, '12-15' from exercises e where e.name = 'Rope Standing Cable Bicep Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-pull', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Barbell Shrugs';

insert into day_templates (id, name, focus, description) values ('sm-5-legs', 'Legs', 'DAY 3 . Quads Focus', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-legs', 'Standard', 0, e.id, 3, '8-12' from exercises e where e.name = 'Leg Extension';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-legs', 'Standard', 1, e.id, 2, '8-12' from exercises e where e.name = 'Leg Press';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-legs', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Walking Lunge';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-legs', 'Standard', 3, e.id, 2, '12-15' from exercises e where e.name = 'Seated Hip Adduction Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-legs', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Seated Calf Raise (Leg Press Machine)';

insert into day_templates (id, name, focus, description) values ('sm-5-upper', 'Upper', 'DAY 5 . Full Upper Body', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-upper', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Push Up';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-upper', 'Standard', 1, e.id, 2, '8-12' from exercises e where e.name = 'Dips';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-upper', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Barbell Row';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-upper', 'Standard', 3, e.id, 2, '12-15' from exercises e where e.name = 'Lateral Raise';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-upper', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Incline Lying Dumbbell Bicep Curl';

insert into day_templates (id, name, focus, description) values ('sm-5-lower', 'Lower', 'DAY 6 . Hamstrings & Glutes Focus', null)
  on conflict (id) do update set name = excluded.name, focus = excluded.focus;
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-lower', 'Standard', 0, e.id, 2, '8-12' from exercises e where e.name = 'Romanian Deadlift';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-lower', 'Standard', 1, e.id, 2, '8-12' from exercises e where e.name = 'Hip Thrust Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-lower', 'Standard', 2, e.id, 2, '8-12' from exercises e where e.name = 'Lying Leg Curl Machine';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-lower', 'Standard', 3, e.id, 2, '8-12' from exercises e where e.name = 'Leg Curl';
insert into day_template_exercises (day_template_id, variant, position, exercise_id, sets, reps) select 'sm-5-lower', 'Standard', 4, e.id, 2, '12-15' from exercises e where e.name = 'Seated Hip Abduction Machine';

insert into splits (id, name, cadence, description, section, position) values ('superman-5', 'Superman 5-Day Split', '5 days', 'Five training days built around push, pull, legs, upper, and lower, using the same 26-exercise pool.', 'coached', 101)
  on conflict (id) do update set name = excluded.name, cadence = excluded.cadence, description = excluded.description, section = excluded.section, position = excluded.position;
delete from split_days where split_id = 'superman-5';
insert into split_days (split_id, position, day_template_id, label) values ('superman-5', 0, 'sm-5-push', 'DAY 1');
insert into split_days (split_id, position, day_template_id, label) values ('superman-5', 1, 'sm-5-pull', 'DAY 2');
insert into split_days (split_id, position, day_template_id, label) values ('superman-5', 2, 'sm-5-legs', 'DAY 3');
insert into split_days (split_id, position, day_template_id, label) values ('superman-5', 3, 'sm-5-upper', 'DAY 5');
insert into split_days (split_id, position, day_template_id, label) values ('superman-5', 4, 'sm-5-lower', 'DAY 6');

commit;
