-- Migration 0039: Overhead Triceps Extension is a cable movement
--
-- It was tagged "Dumbbell". The form video for this entry is the cable
-- rope version (low pulley, both hands overhead), so the equipment tag
-- and the equipment filter in the picker were wrong. Same exercise id,
-- same video. Safe to re-run.

update exercises set equipment = 'Cable'
where name = 'Overhead Triceps Extension' and equipment = 'Dumbbell';
