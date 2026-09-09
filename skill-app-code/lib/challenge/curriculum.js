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
  { key: "session", label: "Did today's session" },
  { key: "meal", label: "Stuck to the meal plan" },
  { key: "weight", label: "Logged my weight (weigh daily)" },
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
export const CHALLENGE_DAYS = [
  {
    day: 1,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Leave 2 to 3 reps in the tank on every set.",
    loomId: null,
  },
  {
    day: 2,
    kind: "rest",
    title: "Rest day",
    what: "No lifting. Get a 20 to 30 minute walk in and hit your protein target. This is where you recover and grow.",
    loomId: null,
  },
  {
    day: 3,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Same rule: stop 2 to 3 reps short of failure.",
    loomId: null,
  },
  {
    day: 4,
    kind: "cardio",
    title: "Cardio",
    what: "25 minutes easy. Incline walk, bike or row at a pace where you can still hold a conversation.",
    loomId: null,
  },
  {
    day: 5,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Try to beat one number from Day 1: a rep or a little more weight.",
    loomId: null,
  },
  {
    day: 6,
    kind: "rest",
    title: "Rest day",
    what: "Walk, protein, sleep. Take a quick progress photo in the same light as your Day 1 one.",
    loomId: null,
  },
  {
    day: 7,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Halfway. Beat something from Day 3.",
    loomId: null,
  },
  {
    day: 8,
    kind: "rest",
    title: "Rest day",
    what: "Full rest or an easy walk. Check your meal plan for the week ahead and do your food shop.",
    loomId: null,
  },
  {
    day: 9,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Week 2. The weights should feel more familiar now, push a little.",
    loomId: null,
  },
  {
    day: 10,
    kind: "cardio",
    title: "Cardio",
    what: "25 minutes easy, same as Day 4. Keep it conversational.",
    loomId: null,
  },
  {
    day: 11,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Beat a number from Day 7.",
    loomId: null,
  },
  {
    day: 12,
    kind: "rest",
    title: "Rest day",
    what: "Walk and protein. Two days left. Do not let the finish line make you sloppy.",
    loomId: null,
  },
  {
    day: 13,
    kind: "train",
    dayTemplateId: "foundations-a",
    title: "Day A",
    what: "Back Squat, Bench Press, Barbell Row, Plank. Last full session. Give it everything, still stopping 1 to 2 reps short.",
    loomId: null,
  },
  {
    day: 14,
    kind: "train",
    dayTemplateId: "foundations-b",
    title: "Day B, then your photo",
    what: "Deadlift, Overhead Press, Lat Pulldown, Plank. Then take your Day 14 photo next to your Day 1 one. That is the real result.",
    loomId: null,
  },
];

export function getChallengeDay(day) {
  return CHALLENGE_DAYS.find((d) => d.day === day) ?? null;
}

// Short course, shown under the day timeline. `kind: "vsl"` gets the
// "work with me" CTA at the end.
export const CHALLENGE_LESSONS = [
  {
    slug: "start-here",
    title: "Start here: how the 14 days work",
    blurb: "Two minutes on the plan, the app and what actually matters over the next fortnight.",
    loomId: null,
    kind: "lesson",
  },
  {
    slug: "day-a-form",
    title: "Day A: form walkthrough",
    blurb: "Back Squat, Bench, Row and Plank. The cues that keep you safe and progressing.",
    loomId: null,
    kind: "lesson",
  },
  {
    slug: "day-b-form",
    title: "Day B: form walkthrough",
    blurb: "Deadlift, Overhead Press, Lat Pulldown and Plank, broken down.",
    loomId: null,
    kind: "lesson",
  },
  {
    slug: "read-your-meal-plan",
    title: "How to read your meal plan",
    blurb: "Portions, swaps and the grocery list. How to make it fit a normal week.",
    loomId: null,
    kind: "lesson",
  },
  {
    slug: "supplements",
    title: "Supplements: what actually matters",
    blurb: "The short list worth your money, and the long list that is not.",
    loomId: null,
    kind: "lesson",
  },
  {
    slug: "main-character",
    title: "How to get lean like a Main Character",
    blurb: "The full picture beyond 14 days, and how 1:1 coaching works if you want me in your corner.",
    loomId: null,
    kind: "vsl",
  },
];
