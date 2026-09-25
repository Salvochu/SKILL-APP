-- Migration 0042: assisted dip/pull-up variations
--
-- Three new library exercises: a machine-assisted dip, a machine-assisted
-- pull-up, and a band-assisted pull-up. Safe to re-run.

insert into exercises (name, equipment, muscle, instructions, video_url, category)
values
  (
    'Assisted Dip Machine',
    'Machine',
    'Arms',
    'Kneel or stand on the platform, dip down until elbows hit 90 degrees, press back up.',
    'https://www.loom.com/share/cb8e99d5611f4f52ba6e213cbcba8df7',
    'exercise'
  ),
  (
    'Assisted Pull Up Machine',
    'Machine',
    'Back',
    'Kneel or stand on the platform, pull your chest toward the bar, lower with control.',
    'https://www.loom.com/share/e4f1e222dc1e4ffbaa07515ab0edf6c0',
    'exercise'
  ),
  (
    'Assisted Banded Pull-up',
    'Bodyweight',
    'Back',
    'Loop a band over the bar and under your knee or foot, pull your chest to the bar, lower with control.',
    'https://www.loom.com/share/c8178b27da8a41fea1d29f2898af36f3',
    'exercise'
  )
on conflict do nothing;
