-- Migration 0011: seed the Stretching Library
--
-- 35 stretches from the public Loom folder
-- https://loom.com/share/folder/220cf1ab6166424eb15be68ea041b1df, one per
-- video. category = 'stretch' keeps them out of the workout logger's
-- exercise picker (see lib/data/exercises.js). Equipment is left null:
-- it is not a useful filter for stretches and the library UI hides the
-- equipment row when every row lacks one. Muscle uses the app's six
-- groups, mapping the folder's body-part prefixes (neck -> Back,
-- forearm/biceps/triceps -> Arms, glutes/hips/groin/calves -> Legs).
--
-- Run in the Supabase SQL Editor after 0010. Safe to re-run: matched on
-- the unique name, re-inserting just refreshes muscle/instructions/video.

insert into exercises (name, category, muscle, instructions, video_url) values
  ('Cat Cow', 'stretch', 'Back', 'On all fours, slowly alternate arching and rounding your spine with your breath.', 'https://www.loom.com/share/65d05809601241f6b38d92dae12bd923'),
  ('Across Body Shoulder Stretch', 'stretch', 'Shoulders', 'Pull one straight arm across your chest with the other arm, keeping that shoulder down.', 'https://www.loom.com/share/d8754d62f0cd4a25b75ed5d8a0accf42'),
  ('Wrist Extensor Stretch (Arm Up)', 'stretch', 'Arms', 'Arm out in front, palm down, gently pull the hand down and back toward you.', 'https://www.loom.com/share/fce5535daaac483a865d37b892faff78'),
  ('Assisted Standing Quad Stretch', 'stretch', 'Legs', 'Hold a support, pull your heel toward your glute, knees together and hips pushed forward.', 'https://www.loom.com/share/bf83d296a40b462eb7b404e654ed2426'),
  ('Ankle Stretch', 'stretch', 'Legs', 'Point the foot and gently press the top of it toward the floor to stretch the front of the ankle.', 'https://www.loom.com/share/2c313eb3575445ad9ce4bf9d694bf37f'),
  ('Hands Behind Head Chest Stretch', 'stretch', 'Chest', 'Hands behind your head, draw the elbows back and open the chest.', 'https://www.loom.com/share/ec3e2b6be7ca465d9390022a045a7266'),
  ('Downward Dog', 'stretch', 'Legs', 'Hips high, heels reaching toward the floor, straight arms and a long spine.', 'https://www.loom.com/share/e82f8e9dacea48c9a3e7f1afcb5eb4c6'),
  ('Cobra Stretch', 'stretch', 'Core', 'Lie face down and press through your hands to lift the chest, keeping the hips on the floor.', 'https://www.loom.com/share/eaab7b61452545ad8e4ccff9b9e6746c'),
  ('Neck Side Stretch', 'stretch', 'Back', 'Gently drop one ear toward that shoulder and let the opposite arm hang.', 'https://www.loom.com/share/69cc70747eaf434481ed099a9da31e13'),
  ('Lying Cross Over Twist', 'stretch', 'Back', 'On your back, cross one knee over your body and let it fall toward the floor, shoulders flat.', 'https://www.loom.com/share/75c674cbbb0f47f4ad494330d62d9379'),
  ('Childs Pose', 'stretch', 'Back', 'Kneel and sit back onto your heels, reach the arms forward and relax the chest down.', 'https://www.loom.com/share/8e94dfb20c934618b41a27d03f4588e0'),
  ('Figure Four Glute Stretch on Box', 'stretch', 'Legs', 'Ankle crossed over the opposite knee on a box, hinge forward with a flat back.', 'https://www.loom.com/share/22984b79474c47488adf2b5e0a8fb982'),
  ('Hamstring Stretch (Knee Bent)', 'stretch', 'Legs', 'Hinge from the hips over a slightly bent front leg, chest tall.', 'https://www.loom.com/share/b48da62f351c433490f770f647fc7a94'),
  ('Neck Flexion Stretch', 'stretch', 'Back', 'Gently drop the chin toward the chest and let the weight of the head do the work.', 'https://www.loom.com/share/181b9fe5df6b44cbb809faecd475556b'),
  ('Inner Thigh Stretch', 'stretch', 'Legs', 'Feet wide, shift your hips toward one bent knee and keep the other leg straight.', 'https://www.loom.com/share/5497575e5a734d58b69694a9a9625bb9'),
  ('Padded Bar Quad Stretch', 'stretch', 'Legs', 'Rear foot resting on a padded bar, tuck the hips under and stay upright.', 'https://www.loom.com/share/efbb6c9bbbe64c6ba11f5271aba33673'),
  ('Overhead Triceps Stretch', 'stretch', 'Arms', 'Bend one elbow overhead and gently press it back with the other hand.', 'https://www.loom.com/share/f308ec0ef1a14861acfdd9424e535b76'),
  ('Kneeling Box Chest Stretch', 'stretch', 'Chest', 'Kneel with your forearms on a box and let the chest sink toward the floor.', 'https://www.loom.com/share/2cbb777745b44082851aca24e1e40570'),
  ('Runners Hamstring Stretch', 'stretch', 'Legs', 'Front leg straight, hips back, hinge forward over the front leg.', 'https://www.loom.com/share/59e1b592de2b45959c8ba6c82f03fa93'),
  ('Kneeling Hip Flexor Stretch', 'stretch', 'Legs', 'Half kneeling, tuck the hips under and shift gently forward.', 'https://www.loom.com/share/6ceffd0cafd7432e99c7a0649499dfd9'),
  ('Lying Figure Four Glute Stretch', 'stretch', 'Legs', 'On your back, ankle over the opposite knee, pull the back thigh toward you.', 'https://www.loom.com/share/a68d9c7c70dc462e98ec88f826170b48'),
  ('Overhead Oblique Stretch', 'stretch', 'Core', 'Reach one arm overhead and lean away to the side, keeping both hips level.', 'https://www.loom.com/share/214dd584545b435bbc58ebe234158f8b'),
  ('Lying Quad Stretch', 'stretch', 'Legs', 'On your side, pull the top heel toward your glute with the knee in line with the hip.', 'https://www.loom.com/share/7c305d73e1a445adaff1b3a7a3b6d6fd'),
  ('Kneeling Box Lat Reach', 'stretch', 'Back', 'Kneel with hands on a box, sit the hips back and reach long through the arms.', 'https://www.loom.com/share/487aec515ec842d4a0a925166c33cd7a'),
  ('Rounded Upper Back Stretch', 'stretch', 'Back', 'Clasp your hands in front, round the upper back and push the hands away.', 'https://www.loom.com/share/a58f38af03884b629e36b751df9ca278'),
  ('Wrist Extensor Stretch', 'stretch', 'Arms', 'Palm down, gently pull the fingers back toward the forearm.', 'https://www.loom.com/share/2a64a5a8eee64a1fab823a4c98c56109'),
  ('Seated Lat Reach Up', 'stretch', 'Back', 'Sit tall, reach one arm overhead and lean slightly to the opposite side.', 'https://www.loom.com/share/1d85ca6c09c9499a9e530b8563237cea'),
  ('Wall Calf Stretch', 'stretch', 'Legs', 'Back leg straight with the heel down, press the hips toward the wall.', 'https://www.loom.com/share/65ca5298b94b47b1a63600fc6bd10257'),
  ('Seated Spinal Twist', 'stretch', 'Legs', 'Seated, cross one foot over the opposite thigh and rotate toward the top knee.', 'https://www.loom.com/share/9465c5b7b93b46dfbf7672068aa844c6'),
  ('Standing Lat Reach Up', 'stretch', 'Back', 'Stand tall, reach one arm overhead and side bend away from it.', 'https://www.loom.com/share/c735165926f74e0d88303d82fd830e95'),
  ('Wrist Flexor Stretch', 'stretch', 'Arms', 'Arm out in front, palm up, gently pull the fingers down and back.', 'https://www.loom.com/share/904c1540ffd0465dad2fc78881a2abfa'),
  ('Standing Quad Stretch', 'stretch', 'Legs', 'Pull your heel to your glute, knees together, hips pushed slightly forward.', 'https://www.loom.com/share/d72a31988a684b63af1b2679a4a81cc1'),
  ('Banded Single Leg Hamstring Stretch', 'stretch', 'Legs', 'On your back with a band around the foot, raise a straight leg until you feel a gentle stretch.', 'https://www.loom.com/share/571d0b8aa6c34c00b507ea415cf8763c'),
  ('Seated Biceps and Shoulder Stretch', 'stretch', 'Arms', 'Hands behind you on the floor, slide the hips forward to open the shoulders and biceps.', 'https://www.loom.com/share/23254a3a29554ad4b73476de9477c5e3'),
  ('Straight Leg Raise Hamstring Stretch', 'stretch', 'Legs', 'On your back, raise one straight leg and gently draw it toward you.', 'https://www.loom.com/share/2f9d642578a94c9e803b1eb43170a851')
on conflict (name) do update set
  category = excluded.category,
  muscle = excluded.muscle,
  instructions = excluded.instructions,
  video_url = excluded.video_url;
