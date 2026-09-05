-- Migration 0013: add exercises from the public exercise Loom folder
--
-- 72 new exercises the folder had that were not in the library
-- yet: machine and cable variations, more direct arm and shoulder work,
-- a full set of ab movements, and the conditioning / plyo drills. Names,
-- muscle and equipment per the reviewed proposal; cues are short and
-- hand-written. category 'exercise' so they show in the logger.
--
-- "Kettlebell" is a new equipment value: the library filter orders
-- unknown values after the known ones, so it just appears as an extra
-- chip. Two kept out on purpose: BRACING Technique (belongs in the
-- Education Library) and Alternating DB Reverse Lunge (too close to the
-- reverse lunge already mapped to Split Squat).
--
-- Also points the existing "Overhead Press" at the folder's dedicated
-- barbell shoulder press clip, rather than adding a near duplicate.
--
-- Run in the Supabase SQL Editor after 0012. Safe to re-run.

insert into exercises (name, category, muscle, equipment, instructions, video_url) values
  ('Arnold Press', 'exercise', 'Shoulders', 'Dumbbell', 'Start with palms facing you, rotate them out as you press overhead, reverse on the way down.', 'https://www.loom.com/share/42298b33364145e59bb1475f56dd6bf1'),
  ('DB Seated Lateral Raise', 'exercise', 'Shoulders', 'Dumbbell', 'Seated upright, raise the dumbbells out to shoulder height leading with the elbows, lower slowly.', 'https://www.loom.com/share/9477184ef4ef43778e668c5bfb7c557b'),
  ('DB Front Raise', 'exercise', 'Shoulders', 'Dumbbell', 'Raise the dumbbells straight in front to shoulder height with a slight elbow bend, lower with control.', 'https://www.loom.com/share/e865d941bf9140819f92745b3a0df2ad'),
  ('Plate Front Raise', 'exercise', 'Shoulders', 'Barbell', 'Hold a plate at the edges, raise it straight in front to shoulder height, lower slowly.', 'https://www.loom.com/share/86f889332d674dc6b248e87c07b63252'),
  ('DB Chest Supported Reverse Fly', 'exercise', 'Shoulders', 'Dumbbell', 'Chest on an incline bench, raise the dumbbells out in a wide arc, squeeze the rear delts.', 'https://www.loom.com/share/d203a894955a4555822356f71908248f'),
  ('Reverse Fly Machine', 'exercise', 'Shoulders', 'Machine', 'Chest against the pad, drive the handles back in a wide arc, squeeze the rear delts.', 'https://www.loom.com/share/776a5aa1dbe24336b95dd1874fd279b1'),
  ('Reverse Snow Angels', 'exercise', 'Shoulders', 'Bodyweight', 'Face down, arms by your sides, sweep them overhead just off the floor and back, palms down.', 'https://www.loom.com/share/b41fe78feed440eb9408c7a7ede1a5ab'),
  ('Chest Press Machine', 'exercise', 'Chest', 'Machine', 'Back flat on the pad, press the handles forward to near lockout, control the return.', 'https://www.loom.com/share/c19240e5725c44b79b16f9a14a7963f6'),
  ('Plate Loaded Chest Press', 'exercise', 'Chest', 'Machine', 'Back on the pad, press the handles forward, stop short of lockout, lower under control.', 'https://www.loom.com/share/9441e418b83a4df6ab04dce82eacf880'),
  ('DB Chest Fly', 'exercise', 'Chest', 'Dumbbell', 'Flat bench, slight elbow bend, lower the dumbbells in a wide arc then hug them back together.', 'https://www.loom.com/share/51fa95f2587e492186339493541e0917'),
  ('Cable Chest Fly (High)', 'exercise', 'Chest', 'Cable', 'Pulleys set high, bring the handles down and together in front of the hips, squeeze the chest.', 'https://www.loom.com/share/ec07a3f7994a418e9e98dc75c3b27a55'),
  ('Cable Chest Fly (Low)', 'exercise', 'Chest', 'Cable', 'Pulleys set low, sweep the handles up and together in front of the chest, squeeze at the top.', 'https://www.loom.com/share/52474c01f6034832bd127e75368b0cac'),
  ('Knee To Elbow Push Up', 'exercise', 'Chest', 'Bodyweight', 'As you lower into the push up, drive one knee out to the same side elbow, alternate sides.', 'https://www.loom.com/share/326695ffb1324f26b39df8f88fdbc166'),
  ('Knee Push Up', 'exercise', 'Chest', 'Bodyweight', 'Push up from the knees, body straight from knees to head, lower the chest to just off the floor.', 'https://www.loom.com/share/5171dd965ee84321bb518cfe17f4033f'),
  ('Chest Floor Push Up', 'exercise', 'Chest', 'Bodyweight', 'Lower all the way to the floor, lift the hands briefly, then press back up.', 'https://www.loom.com/share/b42fa75d2e814c5f8fd1f1213a5f3c7f'),
  ('Push Ups on Yoga Blocks', 'exercise', 'Chest', 'Bodyweight', 'Hands on blocks for a deeper range, lower the chest between them, press back up.', 'https://www.loom.com/share/b57ca8a9e0ab4d32a2ec0c9f5f555454'),
  ('Plate Loaded Row Machine', 'exercise', 'Back', 'Machine', 'Chest on the pad, pull the handles to your ribs, squeeze the shoulder blades, control the return.', 'https://www.loom.com/share/cae0c668d0b143edb4a4cbd0ec8a636d'),
  ('DB Chest Supported Row', 'exercise', 'Back', 'Dumbbell', 'Chest on an incline bench, row the dumbbells to your ribs, squeeze the back, lower slowly.', 'https://www.loom.com/share/b923c8231d264386b784011080991d67'),
  ('Straight Arm Cable Pulldown', 'exercise', 'Back', 'Cable', 'Arms straight, pull the bar down to your thighs in an arc, feel the lats, return under control.', 'https://www.loom.com/share/e406f294793141f38d99543960aa0c5f'),
  ('Single Arm Cable Pulldown', 'exercise', 'Back', 'Cable', 'One arm overhead on the cable, pull the elbow down to your side, squeeze the lat, control back up.', 'https://www.loom.com/share/5571c2967a044d8dbc368d1cb0d1f0eb'),
  ('Lat Pulldown (MAG Grip)', 'exercise', 'Back', 'Cable', 'Neutral MAG grip, pull the handle to your upper chest, drive the elbows down, control the return.', 'https://www.loom.com/share/fe079ae83744492da117e0acd45d79c5'),
  ('Back Hyperextension (Spine Erectors)', 'exercise', 'Back', 'Machine', 'Hips on the pad, round down then extend to a straight line leading with the spine, no overextension.', 'https://www.loom.com/share/e845d07e78244c929defc2d99ddc5b6d'),
  ('EZ Bar Curl', 'exercise', 'Arms', 'Barbell', 'Elbows pinned to your sides, curl the EZ bar up, squeeze the biceps, lower under control.', 'https://www.loom.com/share/44eb82f016cb40a0bc869b2f5fd9128b'),
  ('Concentration Curl', 'exercise', 'Arms', 'Dumbbell', 'Seated, elbow braced on the inner thigh, curl the dumbbell up, squeeze, lower slowly.', 'https://www.loom.com/share/bcde90e93bfe43b993997f8fd6b5978f'),
  ('Spider Curl', 'exercise', 'Arms', 'Dumbbell', 'Chest on an incline bench, arms hanging, curl the dumbbells up, squeeze hard at the top.', 'https://www.loom.com/share/f31d08f9728647f7b03fdafe0b51f983'),
  ('Cable Rope Triceps Extension', 'exercise', 'Arms', 'Cable', 'Elbows tucked, push the rope down and spread the ends apart at the bottom, control back up.', 'https://www.loom.com/share/dc911bc0758a4c459a63235da10a5c37'),
  ('Lying EZ Bar Triceps Extension', 'exercise', 'Arms', 'Barbell', 'Lying flat, lower the EZ bar towards your forehead by bending the elbows, extend back up.', 'https://www.loom.com/share/b27f97644acd44bd869b7ed039bb9e28'),
  ('Lying DB Triceps Extension', 'exercise', 'Arms', 'Dumbbell', 'Lying flat, lower the dumbbells beside your head, keep the elbows still, extend back up.', 'https://www.loom.com/share/728cefd064c648ae86e290248fdb34f3'),
  ('Triceps Kickback', 'exercise', 'Arms', 'Dumbbell', 'Hinge forward, upper arm pinned to your side, extend the elbow back to straight, squeeze.', 'https://www.loom.com/share/5429c583f47943a8b2298d4939e952f2'),
  ('Single Arm Cuffed Triceps Extension', 'exercise', 'Arms', 'Cable', 'Cuff on the wrist, elbow high and still, extend the arm down to straight, control back up.', 'https://www.loom.com/share/b82328fbf7ad49ec99fc9ca58f50f5b8'),
  ('Dips (Triceps Focus)', 'exercise', 'Arms', 'Bodyweight', 'Torso upright, lower until the elbows reach 90 degrees, press back up, keep the elbows close.', 'https://www.loom.com/share/adb03aa89a2346139020d703dac6ce1e'),
  ('Smith Machine Squat', 'exercise', 'Legs', 'Machine', 'Bar on the upper back, feet slightly forward, squat to depth, drive up through the whole foot.', 'https://www.loom.com/share/74c234ceacc04b5a9f5ebb984fe4f772'),
  ('Trap Bar Deadlift', 'exercise', 'Legs', 'Barbell', 'Stand inside the bar, flat back, drive through the floor to stand tall, lower under control.', 'https://www.loom.com/share/f4269a70eb6b4d53b81a76c2aee14c6b'),
  ('DB Box Step Up', 'exercise', 'Legs', 'Dumbbell', 'Full foot on the box, drive through it to stand tall, lower slowly, keep the knee over the toes.', 'https://www.loom.com/share/0af5c514a7e34e4c80071b7cfee1d4ee'),
  ('Chair Step Up', 'exercise', 'Legs', 'Bodyweight', 'Full foot on the chair, push through it to stand, step down with control, knee tracking over the toes.', 'https://www.loom.com/share/cca9c7b467dc4a7184de54109bed12b8'),
  ('Single Leg Glute Bridge', 'exercise', 'Legs', 'Bodyweight', 'One foot planted, the other leg extended, drive the hips up, squeeze the glute, lower under control.', 'https://www.loom.com/share/cbd1588f1f584a0e86ed0ae27fd613b4'),
  ('Back Hyperextension (Glutes)', 'exercise', 'Legs', 'Machine', 'Hips on the pad, round the back slightly and squeeze the glutes to lift to a straight line.', 'https://www.loom.com/share/d529256cd72f45a2aa6c26de74459c36'),
  ('Hanging Leg Raise', 'exercise', 'Core', 'Bodyweight', 'Hang from a bar, raise straight legs to hip height or higher, lower slowly, no swinging.', 'https://www.loom.com/share/d3c6c250c21e47bdbab6503a63114bbd'),
  ('Hanging Knee Raise', 'exercise', 'Core', 'Bodyweight', 'Hang from a bar, draw the knees up towards the chest, lower with control, no swinging.', 'https://www.loom.com/share/c1f2130513ea43edb2c25556d8db5c61'),
  ('Hollow Hold', 'exercise', 'Core', 'Bodyweight', 'On your back, lower back pressed down, lift the shoulders and legs, hold a shallow banana shape.', 'https://www.loom.com/share/a8bdee9a72ae4876b6c66667cc51c832'),
  ('Dead Bug', 'exercise', 'Core', 'Bodyweight', 'On your back, arms up and knees bent, lower the opposite arm and leg, keep the lower back flat.', 'https://www.loom.com/share/87b80cf7c87e41eaba14567d0c912cbd'),
  ('Flutter Kicks', 'exercise', 'Core', 'Bodyweight', 'On your back, legs straight and just off the floor, alternate small up and down kicks.', 'https://www.loom.com/share/b2b90f10372c4efe93adb47d8a6030ae'),
  ('Bicycle Crunch', 'exercise', 'Core', 'Bodyweight', 'Alternate bringing each elbow to the opposite knee while extending the other leg long.', 'https://www.loom.com/share/a429629e2bc840bf9eb058b804920ab6'),
  ('Stability Ball Crunch', 'exercise', 'Core', 'Bodyweight', 'Lower back on the ball, crunch up curling the ribs to the hips, lower for a full stretch.', 'https://www.loom.com/share/70545f5acc36490c9e46437cc439b147'),
  ('Plank Up Downs', 'exercise', 'Core', 'Bodyweight', 'From a forearm plank, press up to your hands one arm at a time, then back down, hips still.', 'https://www.loom.com/share/39e47924d5e946cb87d298d28d2a2f1f'),
  ('Side Plank Leg Raise', 'exercise', 'Core', 'Bodyweight', 'In a side plank, raise the top leg and lower it with control, keep the hips stacked and lifted.', 'https://www.loom.com/share/b2306982d1f64b0bb230c041c090a33c'),
  ('Decline Crunch Machine', 'exercise', 'Core', 'Machine', 'Curl the torso towards the hips against the resistance, control the return, do not just hinge.', 'https://www.loom.com/share/261e8fa596d2419989c51c6df00f773f'),
  ('Sit Up', 'exercise', 'Core', 'Bodyweight', 'Knees bent, curl all the way up to sitting, lower under control.', 'https://www.loom.com/share/21c813783c0a404487f8c9d75dae8ee4'),
  ('Reverse Crunch', 'exercise', 'Core', 'Bodyweight', 'On your back, knees bent, curl the hips off the floor towards the ribs, lower slowly.', 'https://www.loom.com/share/9581447b4ac74d8e8116a13d92d63170'),
  ('Lying Leg Raise', 'exercise', 'Core', 'Bodyweight', 'On your back, legs straight, lower them towards the floor and raise back up, keep the lower back down.', 'https://www.loom.com/share/56fd9d67825644148fe1a0b25e843980'),
  ('Scissor Kicks', 'exercise', 'Core', 'Bodyweight', 'On your back, legs straight and off the floor, cross one leg over the other and switch.', 'https://www.loom.com/share/122dabb08ca9436ca07838b3b9bfd029'),
  ('Toe Touch Crunch', 'exercise', 'Core', 'Bodyweight', 'Legs straight up, reach the hands towards the toes, curling the shoulder blades off the floor.', 'https://www.loom.com/share/ef329604e65245289806ef1d6f7b9d9b'),
  ('Plank Shoulder Tap', 'exercise', 'Core', 'Bodyweight', 'In a high plank, tap the opposite shoulder with each hand, keep the hips from rocking.', 'https://www.loom.com/share/cf57e4d952444638a4cea3f6cbfcc72e'),
  ('Military Crunch', 'exercise', 'Core', 'Bodyweight', 'Legs straight, arms by your sides, crunch the upper body up, lower with control.', 'https://www.loom.com/share/34e774af183d4c879eee3f3f66294663'),
  ('Plank Reach', 'exercise', 'Core', 'Bodyweight', 'From a plank, reach one arm forward and return, alternate, keep the hips level.', 'https://www.loom.com/share/6332503c341744bcacdada571eb88061'),
  ('Side Plank', 'exercise', 'Core', 'Bodyweight', 'Forearm under the shoulder, hips lifted to a straight line, hold, then switch sides.', 'https://www.loom.com/share/7d05a4656178493fa733d69ddf9f29c5'),
  ('Lying Side Crunch', 'exercise', 'Core', 'Bodyweight', 'On your side with legs straight, crunch the ribs towards the hip, lower slowly.', 'https://www.loom.com/share/737196b641f54a3a864e616688e92c55'),
  ('Slam Ball Russian Twist', 'exercise', 'Core', 'Bodyweight', 'Seated with the feet up, rotate the ball side to side, tapping it down by each hip.', 'https://www.loom.com/share/1a34b10bb77d466c9a0323df8b573a47'),
  ('Box Jump', 'exercise', 'Legs', 'Bodyweight', 'Dip and swing the arms, jump onto the box landing soft with bent knees, step back down.', 'https://www.loom.com/share/5aa38b5aceab468fb6060b36388c2599'),
  ('Slam Ball Squat Jump', 'exercise', 'Legs', 'Bodyweight', 'Hold the ball at your chest, squat then jump, landing soft into the next rep.', 'https://www.loom.com/share/7132d164dc5240b098ade5a078f4089c'),
  ('Slam Ball to Sprawl', 'exercise', 'Core', 'Bodyweight', 'Slam the ball down, sprawl back to a plank, jump the feet back in and repeat.', 'https://www.loom.com/share/d2394982ef3e423cb0df4844b7c2320c'),
  ('Lunge Jump', 'exercise', 'Legs', 'Bodyweight', 'From a lunge, jump and switch legs in the air, landing soft into the next lunge.', 'https://www.loom.com/share/45e7944a20034328bc8c6df4c64a7aaf'),
  ('Leg Raise Into Jump', 'exercise', 'Legs', 'Bodyweight', 'Raise a straight leg, then explode into a jump, alternate legs each rep.', 'https://www.loom.com/share/3ac1dcf4e08642bc9388ca15eaf1c090'),
  ('Lateral Box Step Over', 'exercise', 'Legs', 'Bodyweight', 'Step one foot then the other over the box sideways staying low, then back the other way.', 'https://www.loom.com/share/a7f35ea94c7b4f8283735814978f7a80'),
  ('Single Leg Bear Sprint', 'exercise', 'Core', 'Bodyweight', 'In a bear position on your hands and one foot, drive the free knee in and out quickly.', 'https://www.loom.com/share/2d70a135e9ce4e818c4b2f1da1b331c5'),
  ('Bear Walk', 'exercise', 'Core', 'Bodyweight', 'On your hands and feet with the knees just off the floor, crawl forward moving opposite hand and foot.', 'https://www.loom.com/share/daf74f91d0704712929b5d453e8e73bc'),
  ('Groiners', 'exercise', 'Legs', 'Bodyweight', 'From a plank, jump both feet up outside the hands, then back, keep a flat back.', 'https://www.loom.com/share/02d732b0def047d39baaf852ac8a8fd1'),
  ('Sit Outs', 'exercise', 'Core', 'Bodyweight', 'From a bear position, rotate the hips and kick one leg through under the body, alternate.', 'https://www.loom.com/share/b0c1fd2a96c64e2c83b08b84a047c9cf'),
  ('Jab Cross', 'exercise', 'Core', 'Bodyweight', 'Light on your feet, throw a lead jab then a rear cross, rotating through the hips.', 'https://www.loom.com/share/5dc9163df9484b679539c5dfbee5a1ef'),
  ('Kettlebell Swing', 'exercise', 'Legs', 'Kettlebell', 'Hinge at the hips to hike the bell back, snap the hips forward to float it to chest height.', 'https://www.loom.com/share/048471aed6754c92ada849d7cdb78140'),
  ('Single Arm Kettlebell Swing', 'exercise', 'Legs', 'Kettlebell', 'One hand on the bell, hinge and hike it back, drive the hips to swing it up, control the arm.', 'https://www.loom.com/share/98acd92bba734a38a10f900484d26203'),
  ('Devil Press', 'exercise', 'Shoulders', 'Dumbbell', 'A dumbbell burpee: chest to the floor, jump the feet in, then swing the dumbbells overhead.', 'https://www.loom.com/share/614ee08409fe43fca7c4bdcf213377b3')
on conflict (name) do update set
  category = excluded.category,
  muscle = excluded.muscle,
  equipment = excluded.equipment,
  instructions = excluded.instructions,
  video_url = excluded.video_url;

update exercises
set video_url = 'https://www.loom.com/share/f87d305cbe5b415ba90dbb48fcfd118c'
where name = 'Overhead Press';
