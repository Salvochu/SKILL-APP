// The 14-Day Main Character Challenge, day by day.
//
// This is the single source of truth for the Challenge tab: what to do
// each day, and the short course of videos. Coach Salvador films the
// Looms and drops the share IDs in here - a slot with `loomId: null`
// renders a tasteful "video coming" state, so the tab ships before the
// filming is done.
//
// A Loom `id` is the last path segment of a share link:
//   https://www.loom.com/share/8f2c...e1  ->  "8f2c...e1"

// The five checklist items, same every day. `session` relabels on rest
// days (see `sessionLabel`). Order here is the order shown.
export const CHECKLIST_ITEMS = [
  { key: "weight", label: "Logged my weight (weigh daily)" },
  { key: "session", label: "Did today's session" },
  { key: "meal", label: "Stuck to the meal plan" },
  { key: "steps", label: "10k steps" },
  { key: "video", label: "Watched today's video" },
];

export const CHECKLIST_KEYS = CHECKLIST_ITEMS.map((i) => i.key);

export function sessionLabel(kind) {
  if (kind === "rest") return "Active recovery (a walk counts)";
  if (kind === "cardio") return "Did today's cardio";
  return "Did today's session";
}

// kind: "train" | "cardio" | "rest"
// dayTemplateId: which foundations day to open in the logger (train only)
// Matches the printed "14-Day Main Character Training Plan" PDF exactly:
// Day A, Cardio, Rest, Day B, Rest, Day A, Rest / Day B, Cardio, Rest, Day
// A, Rest, Day B, Photo Day. 6 training days total, 1 cardio a week, a
// rest (or cardio) day always falls between two lifting days.
export const CHALLENGE_DAYS = [
  {
    day: 1,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Leave 2 to 3 reps in the tank on every set.",
    loomId: "c4d59f41aa294ea38e145015a80b3415",
  },
  {
    day: 2,
    kind: "cardio",
    title: "Cardio",
    what: "20 to 30 minutes, easy enough to hold a conversation. Walk, incline treadmill, bike, rower or stairs, your pick.",
    loomId: "bdbf4928fd2f4eb38321fb0a4d2db8b1",
  },
  {
    day: 3,
    kind: "rest",
    title: "Rest day",
    what: "No lifting. Get your steps in and hit your protein target. This is where you recover and grow.",
    loomId: "76c8753a10d641738b8ec68ada79b082",
  },
  {
    day: 4,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Same rule: stop 2 to 3 reps short of failure.",
    loomId: "2e86854becc344cfa433d843c3947b05",
  },
  {
    day: 5,
    kind: "rest",
    title: "Rest day",
    what: "Walk, protein, sleep. Take a quick progress photo in the same light as your Day 1 one.",
    loomId: "6dc7266ee5b14b27aa89b86b34ae0068",
  },
  {
    day: 6,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Try to beat one number from Day 1: a rep or a little more weight.",
    loomId: "198eef226fc9427bbc94b73af6790924",
  },
  {
    day: 7,
    kind: "rest",
    title: "Rest day",
    what: "Full rest or an easy walk. Week 1 done. Check your meal plan for the week ahead and do your food shop.",
    loomId: "b0455e756e3c424fb614566a35ad0bf8",
  },
  {
    day: 8,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Week 2. Beat a number from Day 4.",
    loomId: "1f9f7ada3eee4b06944e11e3073437d2",
  },
  {
    day: 9,
    kind: "cardio",
    title: "Cardio",
    what: "20 to 30 minutes, same as Day 2. Keep it conversational.",
    loomId: "44a5b566edec4085a3a0a6d88b45b7a3",
  },
  {
    day: 10,
    kind: "rest",
    title: "Rest day",
    what: "Walk and protein. A few days left. Do not let the finish line make you sloppy.",
    loomId: "29ab3ab6162d406683d8afce76509f4d",
  },
  {
    day: 11,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Beat a number from Day 6.",
    loomId: "f80dfcd31fdd457e8e2fdcce7099f878",
  },
  {
    day: 12,
    kind: "rest",
    title: "Rest day",
    what: "Walk, protein, sleep. One more session to go.",
    loomId: "3612ebb29fee4d6caa1c453b7e43fce9",
  },
  {
    day: 13,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Last session. Give it everything, still stopping 1 to 2 reps short.",
    loomId: "40d7568a140d4e708c05df88f9c5cf70",
  },
  {
    day: 14,
    kind: "rest",
    title: "Photo Day",
    what: "No training today. Take your Day 14 photo next to your Day 1 one. That is the real result.",
    loomId: "0144af13febf467a8a16bc0e05e86424",
  },
];

export function getChallengeDay(day) {
  return CHALLENGE_DAYS.find((d) => d.day === day) ?? null;
}

// The "Before you start" setup steps, pinned at the top of the Challenge
// tab (open on days 1-2, collapsed after).
export const SETUP_STEPS = [
  {
    title: "Take your day 1 photos",
    detail:
      "Front, side and back. Same spot, same light, same time of day. You will compare them to your day 14 photos, and that is the real before and after.",
  },
  {
    title: "Weigh in every morning",
    detail:
      "First thing, before food or water, and log it in the app. Do not read into one day. The daily number bounces around; the 14-day line is what tells the truth.",
  },
  {
    title: "Three sessions, plus one cardio",
    detail:
      "Alternate Day A and Day B with a rest day between lifts, and add one easy 20 to 30 minute cardio session each week. If life gets in the way, do two sessions. Never zero.",
  },
  {
    title: "Follow the meal plan",
    detail:
      'It is in your welcome email, matched to your bodyweight. Portions, not calorie counting. Watch "How to read your meal plan" in Learn below before your first shop.',
  },
];

// Short course, shown under the day timeline. `kind: "vsl"` gets the
// "work with me" CTA at the end.
export function getLesson(slug) {
  return CHALLENGE_LESSONS.find((l) => l.slug === slug) ?? null;
}

export const CHALLENGE_LESSONS = [
  {
    slug: "start-here",
    title: "Start here: how the 14 days work",
    blurb: "Two minutes on the plan, the app and what actually matters over the next fortnight.",
    loomId: "a85562aaa101456cb978e9c873374d1e",
    // Filmed vertical, same as the welcome video and the daily check-ins.
    orientation: "vertical",
    kind: "lesson",
  },
  {
    slug: "day-a-form",
    title: "Day A: form walkthrough",
    blurb: "The cues that keep you safe and progressing, for your version of Day A.",
    // Two cuts, same lesson: the exercise names differ by equipment, so
    // the app shows whichever one matches the account's own variant
    // (see ChallengeLearn.js) instead of listing both.
    loomIdByVariant: { "Full Gym": "447fd2ab5a3b4b9d8f30c115e62bf7f9", Dumbbells: "9e7f7c13ea3c4f28a243eaa711ecd8a3" },
    orientation: "horizontal",
    kind: "lesson",
  },
  {
    slug: "day-b-form",
    title: "Day B: form walkthrough",
    blurb: "The cues that keep you safe and progressing, for your version of Day B.",
    loomIdByVariant: { "Full Gym": "1df9019a6eb94bcc9a169643d21734b1", Dumbbells: "c1c0c3f136174f26831fd9009a07d566" },
    orientation: "horizontal",
    kind: "lesson",
  },
  {
    slug: "read-your-meal-plan",
    title: "How to read your meal plan",
    blurb: "Portions, swaps and the grocery list. How to make it fit a normal week.",
    loomId: "3599bf2717514f00b2a4a1257369b528",
    orientation: "horizontal",
    kind: "lesson",
  },
  {
    slug: "supplements",
    title: "Supplements: what actually matters",
    blurb: "The short list worth your money, and the long list that is not.",
    loomId: "89e1f9443f4c477bb0bb156698730126",
    orientation: "horizontal",
    kind: "lesson",
  },
  {
    slug: "eating-out",
    title: "Eating out without derailing",
    blurb: "A simple plan for the night out, the work dinner, the one meal you didn't cook yourself.",
    loomId: "781bebbb033d45f4b358743004487dee",
    orientation: "horizontal",
    kind: "lesson",
  },
  {
    slug: "main-character",
    title: "How to get lean like a Main Character",
    blurb: "The full picture beyond 14 days…",
    orientation: "horizontal",
    loomId: "61bff9df0ff4413c99602bc6d78eadde",
    kind: "vsl",
  },
];
