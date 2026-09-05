-- Migration 0012: real how-to text for the stretches
--
-- Replaces the placeholder cues from 0011 with the actual on-screen
-- instructions from each Loom video (the movement description plus the
-- "Tip:" line), so the "How to perform" panel matches what the video
-- shows. Obvious typos in the captions were corrected.
--
-- Run in the Supabase SQL Editor after 0011. Safe to re-run.

update exercises set instructions = case name
    when 'Cat Cow' then 'On all fours, knees directly under the hips and hands under the shoulders, round the back and tuck the head under, then arch the back. Tip: open the shoulder blades for extra stretch.'
    when 'Across Body Shoulder Stretch' then 'Stand with one arm across the body at shoulder height, bending the other arm to a 90 degree angle to assist the stretch, pulling it closer to the body. Tip: keep the shoulder down for a greater stretch.'
    when 'Wrist Extensor Stretch (Arm Up)' then 'Extend the arm with the affected wrist in front of you, fingers pointing down. Use your other hand to gently bend the wrist until you feel a stretch. Tip: try to sit tall.'
    when 'Assisted Standing Quad Stretch' then 'Holding a wall for balance, stand on one leg and hold the foot of the other bent leg behind you. Tip: imagine pressing the knee down towards the ground as you pull the foot up for a full stretch.'
    when 'Ankle Stretch' then 'Sit on the edge of a box with one leg straight out. Rotate the ankle in large circles in both directions. Tip: try to sit tall.'
    when 'Hands Behind Head Chest Stretch' then 'Stand or sit with both hands behind the head. Keeping the chest forward, draw the elbows back. Tip: try not to arch.'
    when 'Downward Dog' then 'In a pike position on your hands and feet, hips in the air and back straight, lower the heels to the ground. Tip: alternate one heel at a time for greater range of motion.'
    when 'Cobra Stretch' then 'Lie on your stomach with your hands on the ground in front of you. Press the upper body up and look to the ceiling. Tip: do not hyperextend the neck, just enough to look up.'
    when 'Neck Side Stretch' then 'Tilt the head, ear towards the shoulder. Let the other arm hang down, fingers towards the ground, and use the opposite hand to gently assist the stretch. Tip: do not pull the neck too hard.'
    when 'Lying Cross Over Twist' then 'Lie on your back, one leg straight, the other bent and crossed over the midline of the body. Tip: try to keep both shoulder blades on the ground.'
    when 'Childs Pose' then 'Sit on your heels with the legs bent under you. Reach the arms straight out in front as far as you can without lifting your seat off your feet. Tip: relax the entire body.'
    when 'Figure Four Glute Stretch on Box' then 'Place a leg on top of a box and bend at the hips until you feel a stretch in the glutes. Tip: think of placing the elbows down for a greater stretch.'
    when 'Hamstring Stretch (Knee Bent)' then 'Lie on your back with one leg up and bent. Hold behind the knee and gently pull it towards the chest. Tip: try to keep the hips on the floor.'
    when 'Neck Flexion Stretch' then 'Drop the head gently forward. You can assist with both hands behind the head, easing into the stretch. Tip: do not pull the neck too hard.'
    when 'Inner Thigh Stretch' then 'Sit tall with the legs bent and the soles of the feet together, close to the body. Gently let the knees drop open. Tip: the closer the feet are to the body, the more challenging the stretch.'
    when 'Padded Bar Quad Stretch' then 'Place one foot on a padded bar or sofa behind you and kneel down until the back leg is fully bent. Tip: think of pushing the hips forward for a greater stretch.'
    when 'Overhead Triceps Stretch' then 'Stand tall with one arm bent behind the head, elbow pointing up. Drop the shoulder as the other hand pulls the elbow back. Tip: try not to sway the back.'
    when 'Kneeling Box Chest Stretch' then 'Kneel down, place one arm on top of a box and drop your chest down. Tip: keep the shoulder joint at a 90 degree angle for a greater stretch.'
    when 'Runners Hamstring Stretch' then 'Sit tall with one leg straight and the other bent, foot to the groin. Staying tall, lean your chest forward. Tip: lean forward from the hips, not chest to leg.'
    when 'Kneeling Hip Flexor Stretch' then 'In a half kneeling position with the back shin on the floor, sink the hip of the back leg forward. Tip: lean back from the hips for a greater stretch.'
    when 'Lying Figure Four Glute Stretch' then 'Lie on your back with one ankle over the opposite knee. Hold both hands behind that knee and draw both legs towards the chest. Tip: try to keep the hips on the floor.'
    when 'Overhead Oblique Stretch' then 'Stand with feet a bit wider than shoulder width and hands overhead. With both hands together, reach up and over to the side. Tip: imagine the shoulder and hip separating.'
    when 'Lying Quad Stretch' then 'Lie on your belly, grab one foot and pull it towards your glutes. Tip: think of pushing the hips down for a greater stretch.'
    when 'Kneeling Box Lat Reach' then 'With hands on a box or chair and kneeling a few feet back, bend at the hips and drop the chest between the arms. Tip: pull the hips back as the chest drops for extra stretch.'
    when 'Rounded Upper Back Stretch' then 'Stand with feet a bit wider than shoulder width. Lift the arms to shoulder height and round the upper back. Tip: imagine separating the shoulder blades for a greater stretch.'
    when 'Wrist Extensor Stretch' then 'Bend the wrist so the fingertips point up, then lean your body weight in to gently apply pressure on the wrists. Tip: do not press down too hard.'
    when 'Seated Lat Reach Up' then 'Sit tall with the arms overhead, hands together, and reach up with both arms. Tip: keep the shoulders from riding up.'
    when 'Wall Calf Stretch' then 'Use a wall for balance with the back leg straight and the back heel on the floor. Tip: think of pressing the floor down with the back heel.'
    when 'Seated Spinal Twist' then 'Sit with one hand behind you and that same side leg bent, foot on the outside of the opposite straight leg. Brace the opposite elbow on the outside of the bent knee to assist the twist, then switch sides. Tip: sit tall.'
    when 'Standing Lat Reach Up' then 'Stand tall with the arms overhead, hands together, and reach up with both arms. Tip: keep the shoulders from riding up.'
    when 'Wrist Flexor Stretch' then 'Bend the wrist so the fingertips point down, then lean your body weight in to gently apply pressure on the wrists. Tip: do not press down too hard.'
    when 'Standing Quad Stretch' then 'Stand on one leg and hold the foot of the other bent leg behind you. Round the back as you reach the arms forward. Tip: imagine pressing the knee down towards the ground as you pull the foot up for a full stretch.'
    when 'Banded Single Leg Hamstring Stretch' then 'Lie on your back, one leg bent with the foot on the floor, the other straight up in the air. Loop a band around that foot, hold the other end and pull the leg towards your head. Tip: keep both hips on the floor.'
    when 'Seated Biceps and Shoulder Stretch' then 'Sit with the palms on the floor behind you and slide the hips forward until you feel the shoulders open. Tip: bring the chest up to feel a greater stretch on the biceps and shoulders.'
    when 'Straight Leg Raise Hamstring Stretch' then 'Lie on your back, one leg bent with the foot on the floor, the other straight up in the air. Hold gently behind the knee and pull the leg towards you. Tip: keep both hips on the floor.'
  end
where category = 'stretch' and name in ('Cat Cow', 'Across Body Shoulder Stretch', 'Wrist Extensor Stretch (Arm Up)', 'Assisted Standing Quad Stretch', 'Ankle Stretch', 'Hands Behind Head Chest Stretch', 'Downward Dog', 'Cobra Stretch', 'Neck Side Stretch', 'Lying Cross Over Twist', 'Childs Pose', 'Figure Four Glute Stretch on Box', 'Hamstring Stretch (Knee Bent)', 'Neck Flexion Stretch', 'Inner Thigh Stretch', 'Padded Bar Quad Stretch', 'Overhead Triceps Stretch', 'Kneeling Box Chest Stretch', 'Runners Hamstring Stretch', 'Kneeling Hip Flexor Stretch', 'Lying Figure Four Glute Stretch', 'Overhead Oblique Stretch', 'Lying Quad Stretch', 'Kneeling Box Lat Reach', 'Rounded Upper Back Stretch', 'Wrist Extensor Stretch', 'Seated Lat Reach Up', 'Wall Calf Stretch', 'Seated Spinal Twist', 'Standing Lat Reach Up', 'Wrist Flexor Stretch', 'Standing Quad Stretch', 'Banded Single Leg Hamstring Stretch', 'Seated Biceps and Shoulder Stretch', 'Straight Leg Raise Hamstring Stretch');
