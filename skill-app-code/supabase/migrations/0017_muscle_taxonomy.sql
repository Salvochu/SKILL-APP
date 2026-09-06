-- Migration 0017: granular muscle taxonomy
--
--   1. muscles: 21 specific muscles, each under one of the 6 parent groups
--      (Chest, Back, Shoulders, Arms, Legs, Core). Reference data, readable
--      by any signed-in user.
--   2. exercise_muscles: many-to-many tags linking an exercise (or stretch)
--      to the muscles it trains, each tagged primary or secondary. A set
--      counts 1.0 toward each primary muscle and 0.5 toward each secondary
--      in the weekly volume model.
--   3. The existing exercises.muscle column is left untouched: it still
--      carries the parent group and drives the per-group colour everywhere.
--
-- Safe to re-run: tables use "if not exists", seeds upsert, and the
-- exercise_muscles seed clears its own generated rows before re-inserting.

begin;

create table if not exists muscles (
  id text primary key,
  name text not null,
  parent text not null,
  position int not null default 0
);

alter table muscles enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'muscles' and policyname = 'muscles readable by authenticated'
  ) then
    create policy "muscles readable by authenticated"
      on muscles for select to authenticated using (true);
  end if;
end $$;

create table if not exists exercise_muscles (
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id text not null references muscles(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'secondary')),
  primary key (exercise_id, muscle_id)
);
create index if not exists exercise_muscles_muscle_idx on exercise_muscles(muscle_id);

alter table exercise_muscles enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'exercise_muscles' and policyname = 'exercise_muscles readable by authenticated'
  ) then
    create policy "exercise_muscles readable by authenticated"
      on exercise_muscles for select to authenticated using (true);
  end if;
end $$;

-- 1. the 21 muscles -----------------------------------------------------
insert into muscles (id, name, parent, position) values
  ('upper_chest', 'Upper chest', 'Chest', 10),
  ('mid_chest', 'Mid / lower chest', 'Chest', 20),
  ('lats', 'Lats', 'Back', 30),
  ('upper_traps', 'Upper traps', 'Back', 40),
  ('mid_back', 'Mid-back (rhomboids)', 'Back', 50),
  ('lower_back', 'Lower back (spinal erectors)', 'Back', 60),
  ('front_delt', 'Front delt', 'Shoulders', 70),
  ('side_delt', 'Side delt', 'Shoulders', 80),
  ('rear_delt', 'Rear delt', 'Shoulders', 90),
  ('biceps', 'Biceps', 'Arms', 100),
  ('triceps', 'Triceps', 'Arms', 110),
  ('forearms', 'Forearms', 'Arms', 120),
  ('quads', 'Quads', 'Legs', 130),
  ('hamstrings', 'Hamstrings', 'Legs', 140),
  ('glutes', 'Glutes', 'Legs', 150),
  ('calves', 'Calves', 'Legs', 160),
  ('adductors', 'Adductors', 'Legs', 170),
  ('abductors', 'Abductors', 'Legs', 180),
  ('hip_flexors', 'Hip flexors', 'Legs', 190),
  ('abs', 'Abs', 'Core', 200),
  ('obliques', 'Obliques', 'Core', 210)
on conflict (id) do update set
  name = excluded.name, parent = excluded.parent, position = excluded.position;

-- 2. exercise -> muscle tags ------------------------------------------
delete from exercise_muscles where exercise_id in (
  '26f8e3ad-2fa6-4b67-aacf-c6cd68d0752d',
  '61f35dd2-d66c-4fb9-aee0-9d439a3ac25c',
  'f94a5b65-5647-461f-908f-146628b758a9',
  '4c83ff75-3e0f-4901-9caa-fe6fcdadbaf6',
  'dcbe00d7-e20b-4da0-9f03-047f693e54c0',
  '949f192d-a915-472a-8cb1-ccc986b104b3',
  '2a237382-0eac-437c-be75-35e574e5204a',
  '32ddfc4c-d4c0-4812-b15c-3d04de1f91b4',
  'a8d91de9-d711-481c-a44f-8055bca579d0',
  '1a4e0552-7867-4ee6-9599-8dce1691dbce',
  '13a58a15-3f98-4162-967a-bd023af41f18',
  '3790df77-7d51-4ebd-9fc3-722d33ff6b15',
  'e7780687-165c-4900-a1da-0e4225cf43a8',
  'a3ed8494-9d12-4b15-b9ba-7314ea109c4b',
  'd0573ae2-395f-4a7e-957c-f135db6fb72c',
  '77710022-6588-4faa-9390-1997b382d6c1',
  '96150c7b-d40e-49ad-8ab2-0f88d1e0ff85',
  '4c9789bf-0369-4bf5-b890-5793ba53990e',
  'afdb168d-0a44-4c1f-b2a1-4902d68feaea',
  '578a7ff5-b44a-49e8-accd-c20a229e5422',
  '83de01d4-37bf-494d-932f-50c449eda892',
  '91d97ba3-d76b-4c2b-a504-17b9e6f2e812',
  '3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8',
  '632a2162-13ee-406e-bd14-bc70699da5aa',
  'f430a032-860b-4ba7-8ece-f421031a2c69',
  '3a65d167-2303-42b9-ad95-9c22f55becdf',
  '9cfff532-d999-4bde-af8f-9f562e5dcec9',
  'ba120ef6-ee6f-4da6-9ca6-5a78351d3c20',
  '96943ade-68b6-40d9-a5d9-d21e382885a6',
  '0a301d89-6c6e-4243-b481-7e2e567150d1',
  '45f99eba-2d57-4f13-ac95-3f833ab66647',
  '82957e44-931a-4eea-8765-c9712e83a68b',
  '07c34e50-c8b9-4ca1-ae23-128782fda824',
  '84148e91-4731-4a01-8f99-1c71e98e9c19',
  '3dc7cb4b-f4c8-4f58-8d58-0f905edfa211',
  'f6af18dc-487e-40c2-a9c5-6f561733945a',
  '8356035f-9825-43a7-9211-3dff538b8330',
  '81322f5f-87db-4032-9d05-8d299dd33f63',
  '3c11f4c5-3cbc-469b-b917-0afd3ddf9704',
  'ad4a6bed-d24c-46ae-b5d8-29eaecd8422a',
  'bac514ad-0afe-4bae-950a-5591a8b94a2d',
  '610d9b10-902f-4db8-ac31-8a1a91500523',
  '2322bf0d-5a48-4aa7-b43c-c0d866e15984',
  'f7f7ebd5-4d19-487c-8924-e19526609510',
  'e8d4099c-d8cb-469e-9e6d-9a773bc03e8a',
  '3335b46b-459c-485a-9a1d-5bb8d1deac74',
  '0ec26cd0-ac7e-4884-aaa6-89ba8d5bcff1',
  '48674c4d-d0d7-4e89-aab6-add89bdce481',
  'bf7b9554-a949-41d9-a9d5-cc555831d463',
  '68d246f6-fe77-49eb-9528-aaf53208f1f2',
  'f67bc693-454f-47b6-8bb9-ff94895a5927',
  'b2be7fff-ec12-432a-b844-09c0131f2433',
  '2db7e6a4-0811-479d-9870-acc5ed8f862b',
  'ab45c196-4b36-4763-94e7-77623180e691',
  'd7f9a3fa-4d2f-4a95-a758-38efd3df2156',
  'b3d40b5b-81f8-450d-95f6-5204b0b67efb',
  '8abba704-3a17-4429-8113-0df588f57584',
  '384a4ac4-b540-40e2-a59d-bf812057c68e',
  'ebaa8837-1c1a-4b92-bf70-efdf0a626323',
  '55e7148b-c669-4860-af76-adee41ce2c50',
  'ea5cc2d7-49eb-458d-8109-223042f0e4c2',
  '8c04ca90-d3fe-4264-b652-7e00ce0de269',
  'a3ce9f85-686c-4dbf-b4dc-642a92e656b6',
  'c6ce8c2c-0971-4049-9fcd-72c7ee9c5f85',
  'd5e54f1d-faee-48fa-83eb-f219b91b1758',
  '30161716-9b18-4aae-a8c2-3df751453c92',
  '0f9d229d-f42f-4aae-be9c-ddc8f75b36b4',
  '176fbca9-008c-46f9-9649-9784c2117aa7',
  '03fecf87-eb8e-4732-9f8f-8374f3479709',
  '6f48f9fa-dcd2-4840-8889-c52720b2ea55',
  '9b08e858-c498-4b99-ad06-87bd450c2592',
  '2525a72a-4611-4785-8d97-6ecc3d3fdf01',
  'c96af9c6-2d93-40a4-943a-8161acd4b3a4',
  '5fa597ac-0a5c-4397-a6e5-1778d43fa408',
  'c6b5727e-080a-433b-bfc3-f5e8f0068b62',
  '345d0f3e-4281-4111-9935-cc14e76e02f1',
  'fefc9f38-17db-4222-9fa0-4e5c6bfebcea',
  '9e8ef86c-b531-4ec1-be61-d8979d38c5a5',
  'e9977332-f0e6-49db-8919-6291d6006a53',
  '6c1a6dac-2679-4c1f-abcc-55524041848f',
  '879c859b-432d-4fae-9bf3-11e60c7eae51',
  'e2faecfe-abab-42ad-b5b1-381a41aafea0',
  '3c876c98-560f-4dd8-8580-e4bdf29178a0',
  '1035b030-fa6e-41e1-a680-1f4c0a6db86b',
  '13705992-0f4b-4b48-bfeb-65c6dbcde9da',
  '2da6c7a5-1058-401b-9e41-b1c2a30dde19',
  '0a8ac319-d933-4211-b8dc-3b186ece2301',
  '6fc262a5-413b-41ef-903c-883d43d4c60d',
  '6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9',
  'dfd67b68-9305-424d-b9b1-f8f7e030f174',
  '04f3ac7e-4759-4532-9450-e36ab05cf1df',
  '35336e76-1399-4401-b6b6-1a945668bebd',
  'de57f0cd-be12-4d51-aab0-910f975b3970',
  '67e653a1-4c80-477a-b34a-0dcf2bb516b5',
  'c9bb413c-4338-445a-a761-ddb8e077e6f2',
  'b6bf64cb-b59c-4e52-a846-03b91ffb7942',
  'f4f70a5e-2937-4143-a46b-d02d06ebeb6c',
  '835ac4cc-5497-4ce7-b0da-8f514b87e8fb',
  '894f38ae-f0fc-43ac-aedd-01ef6f524292',
  'b1601356-87cd-4a01-925a-2713e8940e2a',
  'a245ccc5-a0cf-4e25-935c-01b3c01b3343',
  '0386868d-ff89-4c0d-88ca-abaf50aa87d1',
  '33999d33-931c-4ba6-8aaf-eb4181a72033',
  'e64cd03c-0533-46ca-b0c6-a7779226ddfc',
  'b20249c6-2c11-4ce4-9b03-dcac304c54ca',
  'bcfceed0-4393-4e2b-a267-8d3551c8be74',
  '74f63ed4-16f8-4c9f-8a24-ae583b734c5e',
  'e86b7b07-f702-4783-a462-389c5dc5bdea',
  '168a30e1-4e04-4142-adc0-6b792eba9118',
  'c4a65697-2636-4107-9ac1-68ab25d7e2db',
  'cd0aa484-52c7-4a03-b473-9f52cfa7b707',
  '3687b4c1-be0e-4816-a340-1bea929ec9ba',
  '2f109eaa-1e67-4c21-b8d8-56bc484a4997',
  '783448c9-e068-42bd-88fa-cfe485dfbfa8',
  'fef2146f-890a-491e-bc2e-2090e5560430',
  '591f0975-d447-46ed-be35-ecf7336b1aa7',
  'a2f85157-4ec3-4af5-9044-05e2a0eeb581',
  '4f519c53-22b8-4f87-b39d-7b14c1597517',
  '964b5cea-45d2-43c0-8181-a475b8f5a653',
  '694518d7-6e24-4756-880d-f12b1849933b',
  '2cf775f7-0a44-4caa-b2bb-2cc360295b4d',
  '28c266f7-4056-4108-b69c-6062eb9935c4',
  '32bbf62a-2093-4ef0-8d2c-31bfb03508b6',
  '54bd3320-462f-4b25-ab9f-49c4385ba2ba',
  '636d35d9-2f37-45a1-8da5-243d81e09da2',
  'f5b4a68a-ccc3-4d10-8c78-567b552f4f91',
  'd13d2fd0-f874-4ccf-8e61-1f732c652683',
  'b9652741-bbbc-4634-82e4-a569a2c5319a',
  '1595723d-94e2-4b92-8a01-839a6c0969f7',
  'c21892f9-91ee-4ddd-bc24-8f56239e1075',
  'eda42eb6-84bc-4607-8659-a80033bc9dce',
  '4591760b-e593-49d7-bd6a-d7b00827e1e2',
  '80ea181d-92b9-4530-aae1-c7dc98073dd4',
  'f32381fc-f882-449a-bb41-32a44b71dd2b',
  '59b0f164-7630-4d7a-b611-4c8576c0e04b',
  'a36b5daf-b63b-4b56-a54e-00e5abf1bbbb',
  'df3ee2ff-5d22-4db2-a2d4-d9feb07eb5d1',
  '79ed46b4-1983-4ccb-a80f-72dea3687ec3',
  '8c7f923e-0e77-4f14-935e-9a4bb34a11cc',
  'e3936b9e-0daf-4a25-906a-64fa88f5fa3b',
  '8fd4eaf7-ac1f-486b-a64e-746f370e6aa5',
  '08df3768-9f21-4029-a246-620f3b7b00ca',
  '4fdfdf61-dfd0-4a19-84a3-85bbf8a7801e',
  '12a299f3-674d-4401-b344-56895b1fc5a9',
  '5e073da7-fbf8-48fe-80b0-c513eb7111e1',
  'cfa9cdd1-094e-4368-baee-b7a5761e9b11',
  'b033fd11-fc99-44da-a372-76a06375f2de',
  '372afd64-1b53-4831-abaa-2a000c32e845',
  '40f1c387-1c40-4eec-a9f1-f8e621e5925a',
  'cca62cb9-a7e5-4ae3-b91c-e3d0f3b07a08',
  '48e37837-c313-40a1-aed2-4f89d380ee9a',
  '2e9c92ac-5fe0-40d8-827f-2fb26dcd563a',
  'b0fd1568-c24b-4d5f-b0f9-e27f920ef4f8',
  '8e2ead38-6a88-4cec-97e9-77ae5f623542',
  'a2418fc3-28d2-40b0-a0d2-8873fd872945',
  'a3f94402-044a-4be1-b806-51836f9bdaef',
  'e046c94f-ffe1-48e3-87a0-2f2cb862db4b',
  '085849e6-e5cd-45a6-ad1e-f06ebdd8209e',
  'd4573939-bb7e-47ed-a9e5-8b5dd8b77d9d',
  'f15c72c7-8186-40a9-9f68-9765785c6154',
  '33de6655-6938-45f9-83d6-b75a4a0cf159',
  '20488ad7-7b10-4254-a285-158982d830db',
  '92704d35-3f72-4fa8-bad8-49cec737c1fe',
  'b481a08d-2452-466e-9b96-92cffa3821a5',
  '3cdee370-3e51-4f13-9110-bf328a42b0dd',
  '82980998-2477-4e4d-a462-9f410bdc3b9c',
  'ecb2b893-fac5-407a-941f-b19d9e4a133b',
  'e87143be-9bb3-4e7f-88c9-e2e7cb595424',
  'bb1481fa-7b52-4fcd-b8ac-219cab2b5fb5',
  '33c144a9-316d-4658-87a2-4cc949071b91'
);

insert into exercise_muscles (exercise_id, muscle_id, role) values
  -- Barbell Curl
  ('26f8e3ad-2fa6-4b67-aacf-c6cd68d0752d', 'biceps', 'primary'),
  ('26f8e3ad-2fa6-4b67-aacf-c6cd68d0752d', 'forearms', 'secondary'),

  -- Cable BAR Bicep Curl
  ('61f35dd2-d66c-4fb9-aee0-9d439a3ac25c', 'biceps', 'primary'),
  ('61f35dd2-d66c-4fb9-aee0-9d439a3ac25c', 'forearms', 'secondary'),

  -- Cable Rope Triceps Extension
  ('f94a5b65-5647-461f-908f-146628b758a9', 'triceps', 'primary'),

  -- Chair Dip
  ('4c83ff75-3e0f-4901-9caa-fe6fcdadbaf6', 'triceps', 'primary'),
  ('4c83ff75-3e0f-4901-9caa-fe6fcdadbaf6', 'mid_chest', 'secondary'),
  ('4c83ff75-3e0f-4901-9caa-fe6fcdadbaf6', 'front_delt', 'secondary'),

  -- Concentration Curl
  ('dcbe00d7-e20b-4da0-9f03-047f693e54c0', 'biceps', 'primary'),
  ('dcbe00d7-e20b-4da0-9f03-047f693e54c0', 'forearms', 'secondary'),

  -- Dips
  ('949f192d-a915-472a-8cb1-ccc986b104b3', 'triceps', 'primary'),
  ('949f192d-a915-472a-8cb1-ccc986b104b3', 'mid_chest', 'secondary'),
  ('949f192d-a915-472a-8cb1-ccc986b104b3', 'front_delt', 'secondary'),

  -- Dips (Triceps Focus)
  ('2a237382-0eac-437c-be75-35e574e5204a', 'triceps', 'primary'),
  ('2a237382-0eac-437c-be75-35e574e5204a', 'mid_chest', 'secondary'),
  ('2a237382-0eac-437c-be75-35e574e5204a', 'front_delt', 'secondary'),

  -- EZ Bar Curl
  ('32ddfc4c-d4c0-4812-b15c-3d04de1f91b4', 'biceps', 'primary'),
  ('32ddfc4c-d4c0-4812-b15c-3d04de1f91b4', 'forearms', 'secondary'),

  -- Hammer Curl
  ('a8d91de9-d711-481c-a44f-8055bca579d0', 'biceps', 'primary'),
  ('a8d91de9-d711-481c-a44f-8055bca579d0', 'forearms', 'primary'),

  -- Incline Lying Dumbbell Bicep Curl
  ('1a4e0552-7867-4ee6-9599-8dce1691dbce', 'biceps', 'primary'),
  ('1a4e0552-7867-4ee6-9599-8dce1691dbce', 'forearms', 'secondary'),

  -- Lying DB Triceps Extension
  ('13a58a15-3f98-4162-967a-bd023af41f18', 'triceps', 'primary'),

  -- Lying EZ Bar Triceps Extension
  ('3790df77-7d51-4ebd-9fc3-722d33ff6b15', 'triceps', 'primary'),

  -- Overhead Triceps Extension
  ('e7780687-165c-4900-a1da-0e4225cf43a8', 'triceps', 'primary'),

  -- Preacher Curl Machine
  ('a3ed8494-9d12-4b15-b9ba-7314ea109c4b', 'biceps', 'primary'),
  ('a3ed8494-9d12-4b15-b9ba-7314ea109c4b', 'forearms', 'secondary'),

  -- Rope Standing Cable Bicep Curl
  ('d0573ae2-395f-4a7e-957c-f135db6fb72c', 'biceps', 'primary'),
  ('d0573ae2-395f-4a7e-957c-f135db6fb72c', 'forearms', 'secondary'),

  -- Single Arm Cuffed Triceps Extension
  ('77710022-6588-4faa-9390-1997b382d6c1', 'triceps', 'primary'),

  -- Spider Curl
  ('96150c7b-d40e-49ad-8ab2-0f88d1e0ff85', 'biceps', 'primary'),
  ('96150c7b-d40e-49ad-8ab2-0f88d1e0ff85', 'forearms', 'secondary'),

  -- Standing Bicep Curl
  ('4c9789bf-0369-4bf5-b890-5793ba53990e', 'biceps', 'primary'),
  ('4c9789bf-0369-4bf5-b890-5793ba53990e', 'forearms', 'secondary'),

  -- Triceps Kickback
  ('afdb168d-0a44-4c1f-b2a1-4902d68feaea', 'triceps', 'primary'),

  -- Triceps Pushdown
  ('578a7ff5-b44a-49e8-accd-c20a229e5422', 'triceps', 'primary'),

  -- Back Extension
  ('83de01d4-37bf-494d-932f-50c449eda892', 'lower_back', 'primary'),
  ('83de01d4-37bf-494d-932f-50c449eda892', 'glutes', 'secondary'),
  ('83de01d4-37bf-494d-932f-50c449eda892', 'hamstrings', 'secondary'),

  -- Back Hyperextension (Spine Erectors)
  ('91d97ba3-d76b-4c2b-a504-17b9e6f2e812', 'lower_back', 'primary'),
  ('91d97ba3-d76b-4c2b-a504-17b9e6f2e812', 'glutes', 'secondary'),
  ('91d97ba3-d76b-4c2b-a504-17b9e6f2e812', 'hamstrings', 'secondary'),

  -- Barbell Row
  ('3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 'lats', 'primary'),
  ('3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 'mid_back', 'primary'),
  ('3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 'rear_delt', 'secondary'),
  ('3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 'biceps', 'secondary'),
  ('3fb4aa12-0d22-49fe-ba59-4b92d17ba3e8', 'forearms', 'secondary'),

  -- Barbell Shrugs
  ('632a2162-13ee-406e-bd14-bc70699da5aa', 'upper_traps', 'primary'),
  ('632a2162-13ee-406e-bd14-bc70699da5aa', 'forearms', 'secondary'),

  -- Bent Over Row
  ('f430a032-860b-4ba7-8ece-f421031a2c69', 'lats', 'primary'),
  ('f430a032-860b-4ba7-8ece-f421031a2c69', 'mid_back', 'primary'),
  ('f430a032-860b-4ba7-8ece-f421031a2c69', 'rear_delt', 'secondary'),
  ('f430a032-860b-4ba7-8ece-f421031a2c69', 'biceps', 'secondary'),
  ('f430a032-860b-4ba7-8ece-f421031a2c69', 'forearms', 'secondary'),

  -- Chest Supported Landmine Row
  ('3a65d167-2303-42b9-ad95-9c22f55becdf', 'lats', 'primary'),
  ('3a65d167-2303-42b9-ad95-9c22f55becdf', 'mid_back', 'primary'),
  ('3a65d167-2303-42b9-ad95-9c22f55becdf', 'rear_delt', 'secondary'),
  ('3a65d167-2303-42b9-ad95-9c22f55becdf', 'biceps', 'secondary'),
  ('3a65d167-2303-42b9-ad95-9c22f55becdf', 'forearms', 'secondary'),

  -- Chin Up
  ('9cfff532-d999-4bde-af8f-9f562e5dcec9', 'lats', 'primary'),
  ('9cfff532-d999-4bde-af8f-9f562e5dcec9', 'biceps', 'primary'),
  ('9cfff532-d999-4bde-af8f-9f562e5dcec9', 'mid_back', 'secondary'),
  ('9cfff532-d999-4bde-af8f-9f562e5dcec9', 'forearms', 'secondary'),

  -- DB Chest Supported Row
  ('ba120ef6-ee6f-4da6-9ca6-5a78351d3c20', 'lats', 'primary'),
  ('ba120ef6-ee6f-4da6-9ca6-5a78351d3c20', 'mid_back', 'primary'),
  ('ba120ef6-ee6f-4da6-9ca6-5a78351d3c20', 'rear_delt', 'secondary'),
  ('ba120ef6-ee6f-4da6-9ca6-5a78351d3c20', 'biceps', 'secondary'),
  ('ba120ef6-ee6f-4da6-9ca6-5a78351d3c20', 'forearms', 'secondary'),

  -- DB Row (one arm)
  ('96943ade-68b6-40d9-a5d9-d21e382885a6', 'lats', 'primary'),
  ('96943ade-68b6-40d9-a5d9-d21e382885a6', 'mid_back', 'primary'),
  ('96943ade-68b6-40d9-a5d9-d21e382885a6', 'rear_delt', 'secondary'),
  ('96943ade-68b6-40d9-a5d9-d21e382885a6', 'biceps', 'secondary'),
  ('96943ade-68b6-40d9-a5d9-d21e382885a6', 'forearms', 'secondary'),

  -- Deadlift
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'hamstrings', 'primary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'glutes', 'primary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'lower_back', 'primary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'lats', 'secondary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'upper_traps', 'secondary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'quads', 'secondary'),
  ('0a301d89-6c6e-4243-b481-7e2e567150d1', 'forearms', 'secondary'),

  -- Inverted Row
  ('45f99eba-2d57-4f13-ac95-3f833ab66647', 'lats', 'primary'),
  ('45f99eba-2d57-4f13-ac95-3f833ab66647', 'mid_back', 'primary'),
  ('45f99eba-2d57-4f13-ac95-3f833ab66647', 'biceps', 'secondary'),
  ('45f99eba-2d57-4f13-ac95-3f833ab66647', 'rear_delt', 'secondary'),
  ('45f99eba-2d57-4f13-ac95-3f833ab66647', 'abs', 'secondary'),

  -- Lat Pulldown
  ('82957e44-931a-4eea-8765-c9712e83a68b', 'lats', 'primary'),
  ('82957e44-931a-4eea-8765-c9712e83a68b', 'mid_back', 'secondary'),
  ('82957e44-931a-4eea-8765-c9712e83a68b', 'biceps', 'secondary'),
  ('82957e44-931a-4eea-8765-c9712e83a68b', 'rear_delt', 'secondary'),
  ('82957e44-931a-4eea-8765-c9712e83a68b', 'forearms', 'secondary'),

  -- Lat Pulldown (MAG Grip)
  ('07c34e50-c8b9-4ca1-ae23-128782fda824', 'lats', 'primary'),
  ('07c34e50-c8b9-4ca1-ae23-128782fda824', 'mid_back', 'secondary'),
  ('07c34e50-c8b9-4ca1-ae23-128782fda824', 'biceps', 'secondary'),
  ('07c34e50-c8b9-4ca1-ae23-128782fda824', 'rear_delt', 'secondary'),
  ('07c34e50-c8b9-4ca1-ae23-128782fda824', 'forearms', 'secondary'),

  -- Plate Loaded Row Machine
  ('84148e91-4731-4a01-8f99-1c71e98e9c19', 'lats', 'primary'),
  ('84148e91-4731-4a01-8f99-1c71e98e9c19', 'mid_back', 'primary'),
  ('84148e91-4731-4a01-8f99-1c71e98e9c19', 'rear_delt', 'secondary'),
  ('84148e91-4731-4a01-8f99-1c71e98e9c19', 'biceps', 'secondary'),
  ('84148e91-4731-4a01-8f99-1c71e98e9c19', 'forearms', 'secondary'),

  -- Pull Up
  ('3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 'lats', 'primary'),
  ('3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 'mid_back', 'secondary'),
  ('3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 'biceps', 'secondary'),
  ('3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 'rear_delt', 'secondary'),
  ('3dc7cb4b-f4c8-4f58-8d58-0f905edfa211', 'forearms', 'secondary'),

  -- Renegade Row
  ('f6af18dc-487e-40c2-a9c5-6f561733945a', 'lats', 'primary'),
  ('f6af18dc-487e-40c2-a9c5-6f561733945a', 'mid_back', 'primary'),
  ('f6af18dc-487e-40c2-a9c5-6f561733945a', 'biceps', 'secondary'),
  ('f6af18dc-487e-40c2-a9c5-6f561733945a', 'rear_delt', 'secondary'),
  ('f6af18dc-487e-40c2-a9c5-6f561733945a', 'abs', 'secondary'),

  -- Seated Cable Row
  ('8356035f-9825-43a7-9211-3dff538b8330', 'lats', 'primary'),
  ('8356035f-9825-43a7-9211-3dff538b8330', 'mid_back', 'primary'),
  ('8356035f-9825-43a7-9211-3dff538b8330', 'rear_delt', 'secondary'),
  ('8356035f-9825-43a7-9211-3dff538b8330', 'biceps', 'secondary'),
  ('8356035f-9825-43a7-9211-3dff538b8330', 'forearms', 'secondary'),

  -- Single Arm Cable Pulldown
  ('81322f5f-87db-4032-9d05-8d299dd33f63', 'lats', 'primary'),
  ('81322f5f-87db-4032-9d05-8d299dd33f63', 'mid_back', 'secondary'),
  ('81322f5f-87db-4032-9d05-8d299dd33f63', 'biceps', 'secondary'),
  ('81322f5f-87db-4032-9d05-8d299dd33f63', 'rear_delt', 'secondary'),
  ('81322f5f-87db-4032-9d05-8d299dd33f63', 'forearms', 'secondary'),

  -- Straight Arm Cable Pulldown
  ('3c11f4c5-3cbc-469b-b917-0afd3ddf9704', 'lats', 'primary'),
  ('3c11f4c5-3cbc-469b-b917-0afd3ddf9704', 'triceps', 'secondary'),
  ('3c11f4c5-3cbc-469b-b917-0afd3ddf9704', 'abs', 'secondary'),

  -- Superman
  ('ad4a6bed-d24c-46ae-b5d8-29eaecd8422a', 'lower_back', 'primary'),
  ('ad4a6bed-d24c-46ae-b5d8-29eaecd8422a', 'glutes', 'secondary'),
  ('ad4a6bed-d24c-46ae-b5d8-29eaecd8422a', 'hamstrings', 'secondary'),

  -- Superman Hold
  ('bac514ad-0afe-4bae-950a-5591a8b94a2d', 'lower_back', 'primary'),
  ('bac514ad-0afe-4bae-950a-5591a8b94a2d', 'glutes', 'secondary'),
  ('bac514ad-0afe-4bae-950a-5591a8b94a2d', 'hamstrings', 'secondary'),

  -- Bench Press
  ('610d9b10-902f-4db8-ac31-8a1a91500523', 'mid_chest', 'primary'),
  ('610d9b10-902f-4db8-ac31-8a1a91500523', 'front_delt', 'secondary'),
  ('610d9b10-902f-4db8-ac31-8a1a91500523', 'triceps', 'secondary'),

  -- Cable Chest Fly (High)
  ('2322bf0d-5a48-4aa7-b43c-c0d866e15984', 'mid_chest', 'primary'),
  ('2322bf0d-5a48-4aa7-b43c-c0d866e15984', 'front_delt', 'secondary'),

  -- Cable Chest Fly (Low)
  ('f7f7ebd5-4d19-487c-8924-e19526609510', 'upper_chest', 'primary'),
  ('f7f7ebd5-4d19-487c-8924-e19526609510', 'front_delt', 'secondary'),

  -- Chest Floor Push Up
  ('e8d4099c-d8cb-469e-9e6d-9a773bc03e8a', 'mid_chest', 'primary'),
  ('e8d4099c-d8cb-469e-9e6d-9a773bc03e8a', 'triceps', 'secondary'),
  ('e8d4099c-d8cb-469e-9e6d-9a773bc03e8a', 'front_delt', 'secondary'),
  ('e8d4099c-d8cb-469e-9e6d-9a773bc03e8a', 'abs', 'secondary'),

  -- Chest Press Machine
  ('3335b46b-459c-485a-9a1d-5bb8d1deac74', 'mid_chest', 'primary'),
  ('3335b46b-459c-485a-9a1d-5bb8d1deac74', 'front_delt', 'secondary'),
  ('3335b46b-459c-485a-9a1d-5bb8d1deac74', 'triceps', 'secondary'),

  -- DB Bench Press
  ('0ec26cd0-ac7e-4884-aaa6-89ba8d5bcff1', 'mid_chest', 'primary'),
  ('0ec26cd0-ac7e-4884-aaa6-89ba8d5bcff1', 'front_delt', 'secondary'),
  ('0ec26cd0-ac7e-4884-aaa6-89ba8d5bcff1', 'triceps', 'secondary'),

  -- DB Chest Fly
  ('48674c4d-d0d7-4e89-aab6-add89bdce481', 'mid_chest', 'primary'),
  ('48674c4d-d0d7-4e89-aab6-add89bdce481', 'front_delt', 'secondary'),

  -- Decline Push Up
  ('bf7b9554-a949-41d9-a9d5-cc555831d463', 'upper_chest', 'primary'),
  ('bf7b9554-a949-41d9-a9d5-cc555831d463', 'front_delt', 'secondary'),
  ('bf7b9554-a949-41d9-a9d5-cc555831d463', 'triceps', 'secondary'),

  -- Incline DB Press
  ('68d246f6-fe77-49eb-9528-aaf53208f1f2', 'upper_chest', 'primary'),
  ('68d246f6-fe77-49eb-9528-aaf53208f1f2', 'mid_chest', 'secondary'),
  ('68d246f6-fe77-49eb-9528-aaf53208f1f2', 'front_delt', 'secondary'),
  ('68d246f6-fe77-49eb-9528-aaf53208f1f2', 'triceps', 'secondary'),

  -- Knee Push Up
  ('f67bc693-454f-47b6-8bb9-ff94895a5927', 'mid_chest', 'primary'),
  ('f67bc693-454f-47b6-8bb9-ff94895a5927', 'triceps', 'secondary'),
  ('f67bc693-454f-47b6-8bb9-ff94895a5927', 'front_delt', 'secondary'),
  ('f67bc693-454f-47b6-8bb9-ff94895a5927', 'abs', 'secondary'),

  -- Knee To Elbow Push Up
  ('b2be7fff-ec12-432a-b844-09c0131f2433', 'mid_chest', 'primary'),
  ('b2be7fff-ec12-432a-b844-09c0131f2433', 'triceps', 'secondary'),
  ('b2be7fff-ec12-432a-b844-09c0131f2433', 'front_delt', 'secondary'),
  ('b2be7fff-ec12-432a-b844-09c0131f2433', 'abs', 'secondary'),

  -- Pec Fly Machine
  ('2db7e6a4-0811-479d-9870-acc5ed8f862b', 'mid_chest', 'primary'),
  ('2db7e6a4-0811-479d-9870-acc5ed8f862b', 'front_delt', 'secondary'),

  -- Plate Loaded Chest Press
  ('ab45c196-4b36-4763-94e7-77623180e691', 'mid_chest', 'primary'),
  ('ab45c196-4b36-4763-94e7-77623180e691', 'front_delt', 'secondary'),
  ('ab45c196-4b36-4763-94e7-77623180e691', 'triceps', 'secondary'),

  -- Push Up
  ('d7f9a3fa-4d2f-4a95-a758-38efd3df2156', 'mid_chest', 'primary'),
  ('d7f9a3fa-4d2f-4a95-a758-38efd3df2156', 'triceps', 'secondary'),
  ('d7f9a3fa-4d2f-4a95-a758-38efd3df2156', 'front_delt', 'secondary'),
  ('d7f9a3fa-4d2f-4a95-a758-38efd3df2156', 'abs', 'secondary'),

  -- Push Ups on Yoga Blocks
  ('b3d40b5b-81f8-450d-95f6-5204b0b67efb', 'mid_chest', 'primary'),
  ('b3d40b5b-81f8-450d-95f6-5204b0b67efb', 'triceps', 'secondary'),
  ('b3d40b5b-81f8-450d-95f6-5204b0b67efb', 'front_delt', 'secondary'),
  ('b3d40b5b-81f8-450d-95f6-5204b0b67efb', 'abs', 'secondary'),

  -- Bear Walk
  ('8abba704-3a17-4429-8113-0df588f57584', 'abs', 'primary'),
  ('8abba704-3a17-4429-8113-0df588f57584', 'obliques', 'secondary'),
  ('8abba704-3a17-4429-8113-0df588f57584', 'front_delt', 'secondary'),
  ('8abba704-3a17-4429-8113-0df588f57584', 'quads', 'secondary'),

  -- Bicycle Crunch
  ('384a4ac4-b540-40e2-a59d-bf812057c68e', 'obliques', 'primary'),
  ('384a4ac4-b540-40e2-a59d-bf812057c68e', 'abs', 'primary'),
  ('384a4ac4-b540-40e2-a59d-bf812057c68e', 'hip_flexors', 'secondary'),

  -- Dead Bug
  ('ebaa8837-1c1a-4b92-bf70-efdf0a626323', 'abs', 'primary'),
  ('ebaa8837-1c1a-4b92-bf70-efdf0a626323', 'hip_flexors', 'secondary'),
  ('ebaa8837-1c1a-4b92-bf70-efdf0a626323', 'obliques', 'secondary'),

  -- Decline Crunch Machine
  ('55e7148b-c669-4860-af76-adee41ce2c50', 'abs', 'primary'),
  ('55e7148b-c669-4860-af76-adee41ce2c50', 'hip_flexors', 'secondary'),
  ('55e7148b-c669-4860-af76-adee41ce2c50', 'obliques', 'secondary'),

  -- Flutter Kicks
  ('ea5cc2d7-49eb-458d-8109-223042f0e4c2', 'abs', 'primary'),
  ('ea5cc2d7-49eb-458d-8109-223042f0e4c2', 'hip_flexors', 'secondary'),
  ('ea5cc2d7-49eb-458d-8109-223042f0e4c2', 'obliques', 'secondary'),

  -- Hanging Knee Raise
  ('8c04ca90-d3fe-4264-b652-7e00ce0de269', 'abs', 'primary'),
  ('8c04ca90-d3fe-4264-b652-7e00ce0de269', 'hip_flexors', 'secondary'),
  ('8c04ca90-d3fe-4264-b652-7e00ce0de269', 'obliques', 'secondary'),

  -- Hanging Leg Raise
  ('a3ce9f85-686c-4dbf-b4dc-642a92e656b6', 'abs', 'primary'),
  ('a3ce9f85-686c-4dbf-b4dc-642a92e656b6', 'hip_flexors', 'secondary'),
  ('a3ce9f85-686c-4dbf-b4dc-642a92e656b6', 'obliques', 'secondary'),

  -- Hollow Hold
  ('c6ce8c2c-0971-4049-9fcd-72c7ee9c5f85', 'abs', 'primary'),
  ('c6ce8c2c-0971-4049-9fcd-72c7ee9c5f85', 'hip_flexors', 'secondary'),
  ('c6ce8c2c-0971-4049-9fcd-72c7ee9c5f85', 'obliques', 'secondary'),

  -- Jab Cross
  ('d5e54f1d-faee-48fa-83eb-f219b91b1758', 'obliques', 'primary'),
  ('d5e54f1d-faee-48fa-83eb-f219b91b1758', 'abs', 'secondary'),
  ('d5e54f1d-faee-48fa-83eb-f219b91b1758', 'front_delt', 'secondary'),

  -- Lying Leg Raise
  ('30161716-9b18-4aae-a8c2-3df751453c92', 'abs', 'primary'),
  ('30161716-9b18-4aae-a8c2-3df751453c92', 'hip_flexors', 'secondary'),
  ('30161716-9b18-4aae-a8c2-3df751453c92', 'obliques', 'secondary'),

  -- Lying Side Crunch
  ('0f9d229d-f42f-4aae-be9c-ddc8f75b36b4', 'obliques', 'primary'),
  ('0f9d229d-f42f-4aae-be9c-ddc8f75b36b4', 'abs', 'primary'),

  -- Military Crunch
  ('176fbca9-008c-46f9-9649-9784c2117aa7', 'abs', 'primary'),
  ('176fbca9-008c-46f9-9649-9784c2117aa7', 'obliques', 'secondary'),

  -- Plank
  ('03fecf87-eb8e-4732-9f8f-8374f3479709', 'abs', 'primary'),
  ('03fecf87-eb8e-4732-9f8f-8374f3479709', 'obliques', 'secondary'),
  ('03fecf87-eb8e-4732-9f8f-8374f3479709', 'front_delt', 'secondary'),

  -- Plank Reach
  ('6f48f9fa-dcd2-4840-8889-c52720b2ea55', 'abs', 'primary'),
  ('6f48f9fa-dcd2-4840-8889-c52720b2ea55', 'obliques', 'secondary'),
  ('6f48f9fa-dcd2-4840-8889-c52720b2ea55', 'front_delt', 'secondary'),

  -- Plank Shoulder Tap
  ('9b08e858-c498-4b99-ad06-87bd450c2592', 'abs', 'primary'),
  ('9b08e858-c498-4b99-ad06-87bd450c2592', 'obliques', 'secondary'),
  ('9b08e858-c498-4b99-ad06-87bd450c2592', 'front_delt', 'secondary'),

  -- Plank Up Downs
  ('2525a72a-4611-4785-8d97-6ecc3d3fdf01', 'abs', 'primary'),
  ('2525a72a-4611-4785-8d97-6ecc3d3fdf01', 'obliques', 'secondary'),
  ('2525a72a-4611-4785-8d97-6ecc3d3fdf01', 'front_delt', 'secondary'),

  -- Reverse Crunch
  ('c96af9c6-2d93-40a4-943a-8161acd4b3a4', 'abs', 'primary'),
  ('c96af9c6-2d93-40a4-943a-8161acd4b3a4', 'hip_flexors', 'secondary'),
  ('c96af9c6-2d93-40a4-943a-8161acd4b3a4', 'obliques', 'secondary'),

  -- Scissor Kicks
  ('5fa597ac-0a5c-4397-a6e5-1778d43fa408', 'abs', 'primary'),
  ('5fa597ac-0a5c-4397-a6e5-1778d43fa408', 'hip_flexors', 'secondary'),
  ('5fa597ac-0a5c-4397-a6e5-1778d43fa408', 'obliques', 'secondary'),

  -- Side Plank
  ('c6b5727e-080a-433b-bfc3-f5e8f0068b62', 'obliques', 'primary'),
  ('c6b5727e-080a-433b-bfc3-f5e8f0068b62', 'abs', 'primary'),

  -- Side Plank Leg Raise
  ('345d0f3e-4281-4111-9935-cc14e76e02f1', 'obliques', 'primary'),
  ('345d0f3e-4281-4111-9935-cc14e76e02f1', 'abs', 'primary'),

  -- Single Leg Bear Sprint
  ('fefc9f38-17db-4222-9fa0-4e5c6bfebcea', 'abs', 'primary'),
  ('fefc9f38-17db-4222-9fa0-4e5c6bfebcea', 'obliques', 'secondary'),
  ('fefc9f38-17db-4222-9fa0-4e5c6bfebcea', 'front_delt', 'secondary'),
  ('fefc9f38-17db-4222-9fa0-4e5c6bfebcea', 'quads', 'secondary'),

  -- Sit Outs
  ('9e8ef86c-b531-4ec1-be61-d8979d38c5a5', 'abs', 'primary'),
  ('9e8ef86c-b531-4ec1-be61-d8979d38c5a5', 'obliques', 'secondary'),
  ('9e8ef86c-b531-4ec1-be61-d8979d38c5a5', 'front_delt', 'secondary'),
  ('9e8ef86c-b531-4ec1-be61-d8979d38c5a5', 'quads', 'secondary'),

  -- Sit Up
  ('e9977332-f0e6-49db-8919-6291d6006a53', 'abs', 'primary'),
  ('e9977332-f0e6-49db-8919-6291d6006a53', 'hip_flexors', 'secondary'),
  ('e9977332-f0e6-49db-8919-6291d6006a53', 'obliques', 'secondary'),

  -- Slam Ball Russian Twist
  ('6c1a6dac-2679-4c1f-abcc-55524041848f', 'obliques', 'primary'),
  ('6c1a6dac-2679-4c1f-abcc-55524041848f', 'abs', 'primary'),

  -- Slam Ball to Sprawl
  ('879c859b-432d-4fae-9bf3-11e60c7eae51', 'abs', 'primary'),
  ('879c859b-432d-4fae-9bf3-11e60c7eae51', 'obliques', 'secondary'),
  ('879c859b-432d-4fae-9bf3-11e60c7eae51', 'front_delt', 'secondary'),
  ('879c859b-432d-4fae-9bf3-11e60c7eae51', 'quads', 'secondary'),

  -- Stability Ball Crunch
  ('e2faecfe-abab-42ad-b5b1-381a41aafea0', 'abs', 'primary'),
  ('e2faecfe-abab-42ad-b5b1-381a41aafea0', 'obliques', 'secondary'),

  -- Toe Touch Crunch
  ('3c876c98-560f-4dd8-8580-e4bdf29178a0', 'abs', 'primary'),
  ('3c876c98-560f-4dd8-8580-e4bdf29178a0', 'hip_flexors', 'secondary'),
  ('3c876c98-560f-4dd8-8580-e4bdf29178a0', 'obliques', 'secondary'),

  -- Back Hyperextension (Glutes)
  ('1035b030-fa6e-41e1-a680-1f4c0a6db86b', 'glutes', 'primary'),
  ('1035b030-fa6e-41e1-a680-1f4c0a6db86b', 'hamstrings', 'secondary'),

  -- Back Squat
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'quads', 'primary'),
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'glutes', 'primary'),
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'hamstrings', 'secondary'),
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'adductors', 'secondary'),
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'calves', 'secondary'),
  ('13705992-0f4b-4b48-bfeb-65c6dbcde9da', 'lower_back', 'secondary'),

  -- Barbell Good Morning
  ('2da6c7a5-1058-401b-9e41-b1c2a30dde19', 'hamstrings', 'primary'),
  ('2da6c7a5-1058-401b-9e41-b1c2a30dde19', 'glutes', 'primary'),
  ('2da6c7a5-1058-401b-9e41-b1c2a30dde19', 'lower_back', 'secondary'),

  -- Bodyweight Squat
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'quads', 'primary'),
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'glutes', 'primary'),
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'hamstrings', 'secondary'),
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'adductors', 'secondary'),
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'calves', 'secondary'),
  ('0a8ac319-d933-4211-b8dc-3b186ece2301', 'lower_back', 'secondary'),

  -- Box Jump
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'quads', 'primary'),
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'glutes', 'primary'),
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'hamstrings', 'secondary'),
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'adductors', 'secondary'),
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'calves', 'secondary'),
  ('6fc262a5-413b-41ef-903c-883d43d4c60d', 'lower_back', 'secondary'),

  -- Bulgarian Split Squat
  ('6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9', 'quads', 'primary'),
  ('6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9', 'glutes', 'primary'),
  ('6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9', 'hamstrings', 'secondary'),
  ('6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9', 'adductors', 'secondary'),
  ('6d5a8bc1-25bb-46b0-8d11-e6b89c2e29e9', 'calves', 'secondary'),

  -- Calf Raise
  ('dfd67b68-9305-424d-b9b1-f8f7e030f174', 'calves', 'primary'),

  -- Chair Step Up
  ('04f3ac7e-4759-4532-9450-e36ab05cf1df', 'quads', 'primary'),
  ('04f3ac7e-4759-4532-9450-e36ab05cf1df', 'glutes', 'primary'),
  ('04f3ac7e-4759-4532-9450-e36ab05cf1df', 'hamstrings', 'secondary'),
  ('04f3ac7e-4759-4532-9450-e36ab05cf1df', 'adductors', 'secondary'),
  ('04f3ac7e-4759-4532-9450-e36ab05cf1df', 'calves', 'secondary'),

  -- DB Box Step Up
  ('35336e76-1399-4401-b6b6-1a945668bebd', 'quads', 'primary'),
  ('35336e76-1399-4401-b6b6-1a945668bebd', 'glutes', 'primary'),
  ('35336e76-1399-4401-b6b6-1a945668bebd', 'hamstrings', 'secondary'),
  ('35336e76-1399-4401-b6b6-1a945668bebd', 'adductors', 'secondary'),
  ('35336e76-1399-4401-b6b6-1a945668bebd', 'calves', 'secondary'),

  -- DB Calf Raise
  ('de57f0cd-be12-4d51-aab0-910f975b3970', 'calves', 'primary'),

  -- DB Romanian Deadlift
  ('67e653a1-4c80-477a-b34a-0dcf2bb516b5', 'hamstrings', 'primary'),
  ('67e653a1-4c80-477a-b34a-0dcf2bb516b5', 'glutes', 'primary'),
  ('67e653a1-4c80-477a-b34a-0dcf2bb516b5', 'lower_back', 'secondary'),

  -- Glute Bridge
  ('c9bb413c-4338-445a-a761-ddb8e077e6f2', 'glutes', 'primary'),
  ('c9bb413c-4338-445a-a761-ddb8e077e6f2', 'hamstrings', 'secondary'),

  -- Goblet Squat
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'quads', 'primary'),
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'glutes', 'primary'),
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'hamstrings', 'secondary'),
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'adductors', 'secondary'),
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'calves', 'secondary'),
  ('b6bf64cb-b59c-4e52-a846-03b91ffb7942', 'lower_back', 'secondary'),

  -- Groiners
  ('f4f70a5e-2937-4143-a46b-d02d06ebeb6c', 'quads', 'primary'),
  ('f4f70a5e-2937-4143-a46b-d02d06ebeb6c', 'glutes', 'primary'),
  ('f4f70a5e-2937-4143-a46b-d02d06ebeb6c', 'hamstrings', 'secondary'),
  ('f4f70a5e-2937-4143-a46b-d02d06ebeb6c', 'adductors', 'secondary'),

  -- Hip Thrust
  ('835ac4cc-5497-4ce7-b0da-8f514b87e8fb', 'glutes', 'primary'),
  ('835ac4cc-5497-4ce7-b0da-8f514b87e8fb', 'hamstrings', 'secondary'),

  -- Hip Thrust Machine
  ('894f38ae-f0fc-43ac-aedd-01ef6f524292', 'glutes', 'primary'),
  ('894f38ae-f0fc-43ac-aedd-01ef6f524292', 'hamstrings', 'secondary'),

  -- Jump Squat
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'quads', 'primary'),
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'glutes', 'primary'),
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'hamstrings', 'secondary'),
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'adductors', 'secondary'),
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'calves', 'secondary'),
  ('b1601356-87cd-4a01-925a-2713e8940e2a', 'lower_back', 'secondary'),

  -- Kettlebell Swing
  ('a245ccc5-a0cf-4e25-935c-01b3c01b3343', 'glutes', 'primary'),
  ('a245ccc5-a0cf-4e25-935c-01b3c01b3343', 'hamstrings', 'primary'),
  ('a245ccc5-a0cf-4e25-935c-01b3c01b3343', 'lower_back', 'secondary'),
  ('a245ccc5-a0cf-4e25-935c-01b3c01b3343', 'side_delt', 'secondary'),
  ('a245ccc5-a0cf-4e25-935c-01b3c01b3343', 'forearms', 'secondary'),

  -- Lateral Box Step Over
  ('0386868d-ff89-4c0d-88ca-abaf50aa87d1', 'quads', 'primary'),
  ('0386868d-ff89-4c0d-88ca-abaf50aa87d1', 'glutes', 'primary'),
  ('0386868d-ff89-4c0d-88ca-abaf50aa87d1', 'hamstrings', 'secondary'),
  ('0386868d-ff89-4c0d-88ca-abaf50aa87d1', 'adductors', 'secondary'),
  ('0386868d-ff89-4c0d-88ca-abaf50aa87d1', 'calves', 'secondary'),

  -- Leg Curl
  ('33999d33-931c-4ba6-8aaf-eb4181a72033', 'hamstrings', 'primary'),
  ('33999d33-931c-4ba6-8aaf-eb4181a72033', 'calves', 'secondary'),

  -- Leg Extension
  ('e64cd03c-0533-46ca-b0c6-a7779226ddfc', 'quads', 'primary'),

  -- Leg Press
  ('b20249c6-2c11-4ce4-9b03-dcac304c54ca', 'quads', 'primary'),
  ('b20249c6-2c11-4ce4-9b03-dcac304c54ca', 'glutes', 'primary'),
  ('b20249c6-2c11-4ce4-9b03-dcac304c54ca', 'hamstrings', 'secondary'),
  ('b20249c6-2c11-4ce4-9b03-dcac304c54ca', 'adductors', 'secondary'),

  -- Leg Raise Into Jump
  ('bcfceed0-4393-4e2b-a267-8d3551c8be74', 'quads', 'primary'),
  ('bcfceed0-4393-4e2b-a267-8d3551c8be74', 'glutes', 'primary'),
  ('bcfceed0-4393-4e2b-a267-8d3551c8be74', 'calves', 'secondary'),
  ('bcfceed0-4393-4e2b-a267-8d3551c8be74', 'hamstrings', 'secondary'),
  ('bcfceed0-4393-4e2b-a267-8d3551c8be74', 'hip_flexors', 'secondary'),

  -- Lunge Jump
  ('74f63ed4-16f8-4c9f-8a24-ae583b734c5e', 'quads', 'primary'),
  ('74f63ed4-16f8-4c9f-8a24-ae583b734c5e', 'glutes', 'primary'),
  ('74f63ed4-16f8-4c9f-8a24-ae583b734c5e', 'hamstrings', 'secondary'),
  ('74f63ed4-16f8-4c9f-8a24-ae583b734c5e', 'adductors', 'secondary'),
  ('74f63ed4-16f8-4c9f-8a24-ae583b734c5e', 'calves', 'secondary'),

  -- Lying Leg Curl Machine
  ('e86b7b07-f702-4783-a462-389c5dc5bdea', 'hamstrings', 'primary'),
  ('e86b7b07-f702-4783-a462-389c5dc5bdea', 'calves', 'secondary'),

  -- Romanian Deadlift
  ('168a30e1-4e04-4142-adc0-6b792eba9118', 'hamstrings', 'primary'),
  ('168a30e1-4e04-4142-adc0-6b792eba9118', 'glutes', 'primary'),
  ('168a30e1-4e04-4142-adc0-6b792eba9118', 'lower_back', 'secondary'),

  -- Seated Calf Raise (Leg Press Machine)
  ('c4a65697-2636-4107-9ac1-68ab25d7e2db', 'calves', 'primary'),

  -- Seated Hip Abduction Machine
  ('cd0aa484-52c7-4a03-b473-9f52cfa7b707', 'abductors', 'primary'),
  ('cd0aa484-52c7-4a03-b473-9f52cfa7b707', 'glutes', 'secondary'),

  -- Seated Hip Adduction Machine
  ('3687b4c1-be0e-4816-a340-1bea929ec9ba', 'adductors', 'primary'),

  -- Single Arm Kettlebell Swing
  ('2f109eaa-1e67-4c21-b8d8-56bc484a4997', 'glutes', 'primary'),
  ('2f109eaa-1e67-4c21-b8d8-56bc484a4997', 'hamstrings', 'primary'),
  ('2f109eaa-1e67-4c21-b8d8-56bc484a4997', 'lower_back', 'secondary'),
  ('2f109eaa-1e67-4c21-b8d8-56bc484a4997', 'side_delt', 'secondary'),
  ('2f109eaa-1e67-4c21-b8d8-56bc484a4997', 'forearms', 'secondary'),

  -- Single Leg Glute Bridge
  ('783448c9-e068-42bd-88fa-cfe485dfbfa8', 'glutes', 'primary'),
  ('783448c9-e068-42bd-88fa-cfe485dfbfa8', 'hamstrings', 'secondary'),

  -- Single Leg Romanian Deadlift
  ('fef2146f-890a-491e-bc2e-2090e5560430', 'hamstrings', 'primary'),
  ('fef2146f-890a-491e-bc2e-2090e5560430', 'glutes', 'primary'),
  ('fef2146f-890a-491e-bc2e-2090e5560430', 'lower_back', 'secondary'),

  -- Slam Ball Squat Jump
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'quads', 'primary'),
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'glutes', 'primary'),
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'hamstrings', 'secondary'),
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'adductors', 'secondary'),
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'calves', 'secondary'),
  ('591f0975-d447-46ed-be35-ecf7336b1aa7', 'lower_back', 'secondary'),

  -- Smith Machine Squat
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'quads', 'primary'),
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'glutes', 'primary'),
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'hamstrings', 'secondary'),
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'adductors', 'secondary'),
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'calves', 'secondary'),
  ('a2f85157-4ec3-4af5-9044-05e2a0eeb581', 'lower_back', 'secondary'),

  -- Split Squat
  ('4f519c53-22b8-4f87-b39d-7b14c1597517', 'quads', 'primary'),
  ('4f519c53-22b8-4f87-b39d-7b14c1597517', 'glutes', 'primary'),
  ('4f519c53-22b8-4f87-b39d-7b14c1597517', 'hamstrings', 'secondary'),
  ('4f519c53-22b8-4f87-b39d-7b14c1597517', 'adductors', 'secondary'),
  ('4f519c53-22b8-4f87-b39d-7b14c1597517', 'calves', 'secondary'),

  -- Trap Bar Deadlift
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'quads', 'primary'),
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'glutes', 'primary'),
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'hamstrings', 'secondary'),
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'lower_back', 'secondary'),
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'upper_traps', 'secondary'),
  ('964b5cea-45d2-43c0-8181-a475b8f5a653', 'forearms', 'secondary'),

  -- Walking Lunge
  ('694518d7-6e24-4756-880d-f12b1849933b', 'quads', 'primary'),
  ('694518d7-6e24-4756-880d-f12b1849933b', 'glutes', 'primary'),
  ('694518d7-6e24-4756-880d-f12b1849933b', 'hamstrings', 'secondary'),
  ('694518d7-6e24-4756-880d-f12b1849933b', 'adductors', 'secondary'),
  ('694518d7-6e24-4756-880d-f12b1849933b', 'calves', 'secondary'),

  -- Arnold Press
  ('2cf775f7-0a44-4caa-b2bb-2cc360295b4d', 'front_delt', 'primary'),
  ('2cf775f7-0a44-4caa-b2bb-2cc360295b4d', 'side_delt', 'secondary'),
  ('2cf775f7-0a44-4caa-b2bb-2cc360295b4d', 'triceps', 'secondary'),
  ('2cf775f7-0a44-4caa-b2bb-2cc360295b4d', 'upper_traps', 'secondary'),

  -- Cuffed Lateral Raise
  ('28c266f7-4056-4108-b69c-6062eb9935c4', 'side_delt', 'primary'),
  ('28c266f7-4056-4108-b69c-6062eb9935c4', 'front_delt', 'secondary'),
  ('28c266f7-4056-4108-b69c-6062eb9935c4', 'upper_traps', 'secondary'),

  -- DB Chest Supported Reverse Fly
  ('32bbf62a-2093-4ef0-8d2c-31bfb03508b6', 'rear_delt', 'primary'),
  ('32bbf62a-2093-4ef0-8d2c-31bfb03508b6', 'mid_back', 'secondary'),
  ('32bbf62a-2093-4ef0-8d2c-31bfb03508b6', 'upper_traps', 'secondary'),

  -- DB Front Raise
  ('54bd3320-462f-4b25-ab9f-49c4385ba2ba', 'front_delt', 'primary'),
  ('54bd3320-462f-4b25-ab9f-49c4385ba2ba', 'side_delt', 'secondary'),

  -- DB Seated Lateral Raise
  ('636d35d9-2f37-45a1-8da5-243d81e09da2', 'side_delt', 'primary'),
  ('636d35d9-2f37-45a1-8da5-243d81e09da2', 'front_delt', 'secondary'),
  ('636d35d9-2f37-45a1-8da5-243d81e09da2', 'upper_traps', 'secondary'),

  -- DB Shoulder Press
  ('f5b4a68a-ccc3-4d10-8c78-567b552f4f91', 'front_delt', 'primary'),
  ('f5b4a68a-ccc3-4d10-8c78-567b552f4f91', 'side_delt', 'secondary'),
  ('f5b4a68a-ccc3-4d10-8c78-567b552f4f91', 'triceps', 'secondary'),
  ('f5b4a68a-ccc3-4d10-8c78-567b552f4f91', 'upper_traps', 'secondary'),

  -- Devil Press
  ('d13d2fd0-f874-4ccf-8e61-1f732c652683', 'front_delt', 'primary'),
  ('d13d2fd0-f874-4ccf-8e61-1f732c652683', 'glutes', 'secondary'),
  ('d13d2fd0-f874-4ccf-8e61-1f732c652683', 'hamstrings', 'secondary'),
  ('d13d2fd0-f874-4ccf-8e61-1f732c652683', 'triceps', 'secondary'),
  ('d13d2fd0-f874-4ccf-8e61-1f732c652683', 'abs', 'secondary'),

  -- Face Pull
  ('b9652741-bbbc-4634-82e4-a569a2c5319a', 'rear_delt', 'primary'),
  ('b9652741-bbbc-4634-82e4-a569a2c5319a', 'mid_back', 'secondary'),
  ('b9652741-bbbc-4634-82e4-a569a2c5319a', 'upper_traps', 'secondary'),

  -- Lateral Raise
  ('1595723d-94e2-4b92-8a01-839a6c0969f7', 'side_delt', 'primary'),
  ('1595723d-94e2-4b92-8a01-839a6c0969f7', 'front_delt', 'secondary'),
  ('1595723d-94e2-4b92-8a01-839a6c0969f7', 'upper_traps', 'secondary'),

  -- Overhead Press
  ('c21892f9-91ee-4ddd-bc24-8f56239e1075', 'front_delt', 'primary'),
  ('c21892f9-91ee-4ddd-bc24-8f56239e1075', 'side_delt', 'secondary'),
  ('c21892f9-91ee-4ddd-bc24-8f56239e1075', 'triceps', 'secondary'),
  ('c21892f9-91ee-4ddd-bc24-8f56239e1075', 'upper_traps', 'secondary'),

  -- Pike Push Up
  ('eda42eb6-84bc-4607-8659-a80033bc9dce', 'front_delt', 'primary'),
  ('eda42eb6-84bc-4607-8659-a80033bc9dce', 'side_delt', 'secondary'),
  ('eda42eb6-84bc-4607-8659-a80033bc9dce', 'triceps', 'secondary'),
  ('eda42eb6-84bc-4607-8659-a80033bc9dce', 'upper_traps', 'secondary'),

  -- Plate Front Raise
  ('4591760b-e593-49d7-bd6a-d7b00827e1e2', 'front_delt', 'primary'),
  ('4591760b-e593-49d7-bd6a-d7b00827e1e2', 'side_delt', 'secondary'),

  -- Rear Delt Fly
  ('80ea181d-92b9-4530-aae1-c7dc98073dd4', 'rear_delt', 'primary'),
  ('80ea181d-92b9-4530-aae1-c7dc98073dd4', 'mid_back', 'secondary'),
  ('80ea181d-92b9-4530-aae1-c7dc98073dd4', 'upper_traps', 'secondary'),

  -- Reverse Fly Machine
  ('f32381fc-f882-449a-bb41-32a44b71dd2b', 'rear_delt', 'primary'),
  ('f32381fc-f882-449a-bb41-32a44b71dd2b', 'mid_back', 'secondary'),
  ('f32381fc-f882-449a-bb41-32a44b71dd2b', 'upper_traps', 'secondary'),

  -- Reverse Snow Angels
  ('59b0f164-7630-4d7a-b611-4c8576c0e04b', 'rear_delt', 'primary'),
  ('59b0f164-7630-4d7a-b611-4c8576c0e04b', 'mid_back', 'secondary'),
  ('59b0f164-7630-4d7a-b611-4c8576c0e04b', 'upper_traps', 'secondary'),

  -- Overhead Triceps Stretch
  ('a36b5daf-b63b-4b56-a54e-00e5abf1bbbb', 'triceps', 'primary'),

  -- Seated Biceps and Shoulder Stretch
  ('df3ee2ff-5d22-4db2-a2d4-d9feb07eb5d1', 'biceps', 'primary'),
  ('df3ee2ff-5d22-4db2-a2d4-d9feb07eb5d1', 'front_delt', 'primary'),

  -- Wrist Extensor Stretch
  ('79ed46b4-1983-4ccb-a80f-72dea3687ec3', 'forearms', 'primary'),

  -- Wrist Extensor Stretch (Arm Up)
  ('8c7f923e-0e77-4f14-935e-9a4bb34a11cc', 'forearms', 'primary'),

  -- Wrist Flexor Stretch
  ('e3936b9e-0daf-4a25-906a-64fa88f5fa3b', 'forearms', 'primary'),

  -- Cat Cow
  ('8fd4eaf7-ac1f-486b-a64e-746f370e6aa5', 'lower_back', 'primary'),
  ('8fd4eaf7-ac1f-486b-a64e-746f370e6aa5', 'abs', 'primary'),

  -- Childs Pose
  ('08df3768-9f21-4029-a246-620f3b7b00ca', 'lats', 'primary'),
  ('08df3768-9f21-4029-a246-620f3b7b00ca', 'lower_back', 'primary'),

  -- Kneeling Box Lat Reach
  ('4fdfdf61-dfd0-4a19-84a3-85bbf8a7801e', 'lats', 'primary'),

  -- Lying Cross Over Twist
  ('12a299f3-674d-4401-b344-56895b1fc5a9', 'glutes', 'primary'),
  ('12a299f3-674d-4401-b344-56895b1fc5a9', 'obliques', 'primary'),
  ('12a299f3-674d-4401-b344-56895b1fc5a9', 'lower_back', 'secondary'),

  -- Neck Flexion Stretch
  ('5e073da7-fbf8-48fe-80b0-c513eb7111e1', 'upper_traps', 'primary'),

  -- Neck Side Stretch
  ('cfa9cdd1-094e-4368-baee-b7a5761e9b11', 'upper_traps', 'primary'),

  -- Rounded Upper Back Stretch
  ('b033fd11-fc99-44da-a372-76a06375f2de', 'mid_back', 'primary'),

  -- Seated Lat Reach Up
  ('372afd64-1b53-4831-abaa-2a000c32e845', 'lats', 'primary'),

  -- Standing Lat Reach Up
  ('40f1c387-1c40-4eec-a9f1-f8e621e5925a', 'lats', 'primary'),

  -- Hands Behind Head Chest Stretch
  ('cca62cb9-a7e5-4ae3-b91c-e3d0f3b07a08', 'mid_chest', 'primary'),
  ('cca62cb9-a7e5-4ae3-b91c-e3d0f3b07a08', 'front_delt', 'primary'),

  -- Kneeling Box Chest Stretch
  ('48e37837-c313-40a1-aed2-4f89d380ee9a', 'mid_chest', 'primary'),
  ('48e37837-c313-40a1-aed2-4f89d380ee9a', 'front_delt', 'primary'),

  -- Cobra Stretch
  ('2e9c92ac-5fe0-40d8-827f-2fb26dcd563a', 'abs', 'primary'),

  -- Overhead Oblique Stretch
  ('b0fd1568-c24b-4d5f-b0f9-e27f920ef4f8', 'obliques', 'primary'),

  -- Ankle Stretch
  ('8e2ead38-6a88-4cec-97e9-77ae5f623542', 'calves', 'primary'),

  -- Assisted Standing Quad Stretch
  ('a2418fc3-28d2-40b0-a0d2-8873fd872945', 'quads', 'primary'),

  -- Banded Single Leg Hamstring Stretch
  ('a3f94402-044a-4be1-b806-51836f9bdaef', 'hamstrings', 'primary'),

  -- Downward Dog
  ('e046c94f-ffe1-48e3-87a0-2f2cb862db4b', 'calves', 'primary'),
  ('e046c94f-ffe1-48e3-87a0-2f2cb862db4b', 'hamstrings', 'primary'),
  ('e046c94f-ffe1-48e3-87a0-2f2cb862db4b', 'lats', 'secondary'),

  -- Figure Four Glute Stretch on Box
  ('085849e6-e5cd-45a6-ad1e-f06ebdd8209e', 'glutes', 'primary'),

  -- Hamstring Stretch (Knee Bent)
  ('d4573939-bb7e-47ed-a9e5-8b5dd8b77d9d', 'hamstrings', 'primary'),

  -- Inner Thigh Stretch
  ('f15c72c7-8186-40a9-9f68-9765785c6154', 'adductors', 'primary'),

  -- Kneeling Hip Flexor Stretch
  ('33de6655-6938-45f9-83d6-b75a4a0cf159', 'hip_flexors', 'primary'),
  ('33de6655-6938-45f9-83d6-b75a4a0cf159', 'quads', 'secondary'),

  -- Lying Figure Four Glute Stretch
  ('20488ad7-7b10-4254-a285-158982d830db', 'glutes', 'primary'),

  -- Lying Quad Stretch
  ('92704d35-3f72-4fa8-bad8-49cec737c1fe', 'quads', 'primary'),

  -- Padded Bar Quad Stretch
  ('b481a08d-2452-466e-9b96-92cffa3821a5', 'quads', 'primary'),

  -- Runners Hamstring Stretch
  ('3cdee370-3e51-4f13-9110-bf328a42b0dd', 'hamstrings', 'primary'),

  -- Seated Spinal Twist
  ('82980998-2477-4e4d-a462-9f410bdc3b9c', 'glutes', 'primary'),
  ('82980998-2477-4e4d-a462-9f410bdc3b9c', 'obliques', 'primary'),
  ('82980998-2477-4e4d-a462-9f410bdc3b9c', 'lower_back', 'secondary'),

  -- Standing Quad Stretch
  ('ecb2b893-fac5-407a-941f-b19d9e4a133b', 'quads', 'primary'),

  -- Straight Leg Raise Hamstring Stretch
  ('e87143be-9bb3-4e7f-88c9-e2e7cb595424', 'hamstrings', 'primary'),

  -- Wall Calf Stretch
  ('bb1481fa-7b52-4fcd-b8ac-219cab2b5fb5', 'calves', 'primary'),

  -- Across Body Shoulder Stretch
  ('33c144a9-316d-4658-87a2-4cc949071b91', 'rear_delt', 'primary')
on conflict (exercise_id, muscle_id) do update set role = excluded.role;

commit;
