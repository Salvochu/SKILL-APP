// Strength Score: the sum of your best current estimated 1RM across six
// movement patterns. One honest number that rises as you get stronger and
// eases back if you stop training a pattern. Pure; safe on server and client.

export const epley1RM = (weight, reps) => {
  const w = Number(weight);
  const r = Number(reps);
  return w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0;
};

const lc = (s) => String(s || "").trim().toLowerCase();

// Lifts whose real load is bodyweight plus whatever is added or taken off.
export const BODYWEIGHT_LOADED = new Set(["pull up", "chin up", "dips", "dips (triceps focus)"]);

export const TIER_NAMES = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];

// Colour per tier, cheap to rich (grey, green, blue, purple, gold). Used
// for the tier label and the strength bar on the Progress page. Indexed
// like TIER_NAMES; works on both light and dark surfaces.
export const TIER_COLORS = ["#8b909a", "#43a047", "#3f86d9", "#9b6dd6", "#f0a021"];

export const tierColorFor = (tierIndex) => TIER_COLORS[Math.max(0, Math.min(4, tierIndex ?? 0))];

// thresholds: [novice, intermediate, advanced, elite] estimated-1RM in kg.
// Ballpark for a general adult trainee; tune against real users. `lifts`
// is an ordered preference list, matched to the library by exact name.
export const MOVEMENT_PATTERNS = [
  {
    key: "squat",
    label: "Squat",
    lifts: [
      "Back Squat", "Goblet Squat", "Bulgarian Split Squat", "Smith Machine Squat",
      "Split Squat", "Leg Press",
    ],
    thresholds: [60, 100, 145, 190],
  },
  {
    key: "hinge",
    label: "Hinge",
    lifts: [
      "Deadlift", "Trap Bar Deadlift", "Romanian Deadlift", "DB Romanian Deadlift",
      "Single Leg Romanian Deadlift", "Barbell Good Morning", "Hip Thrust", "Hip Thrust Machine",
    ],
    thresholds: [80, 125, 175, 230],
  },
  {
    key: "hpush",
    label: "Horiz. push",
    lifts: [
      "Bench Press", "DB Bench Press", "Incline DB Press", "Chest Press Machine",
      "Plate Loaded Chest Press", "Dips", "Dips (Triceps Focus)",
    ],
    thresholds: [45, 75, 105, 140],
  },
  {
    key: "vpush",
    label: "Vert. push",
    lifts: ["Overhead Press", "DB Shoulder Press", "Arnold Press"],
    thresholds: [30, 47, 62, 80],
  },
  {
    key: "hpull",
    label: "Horiz. pull",
    lifts: [
      "Bent Over Row", "Barbell Row", "DB Row", "DB Chest Supported Row",
      "Chest Supported Landmine Row", "Seated Cable Row", "Plate Loaded Row Machine", "Renegade Row",
    ],
    thresholds: [45, 70, 95, 125],
  },
  {
    key: "vpull",
    label: "Vert. pull",
    lifts: [
      "Pull Up", "Chin Up", "Lat Pulldown", "Lat Pulldown (MAG Grip)", "Single Arm Cable Pulldown",
    ],
    // Absolute (pulldown). A pull-up / chin-up is scored on weight added
    // over bodyweight instead, see PULLUP_SCALE.
    thresholds: [45, 65, 90, 115],
  },
];

const PULLUP_SCALE = [0, 15, 35, 55];

const PATTERN_BY_LIFT = (() => {
  const m = new Map();
  for (const p of MOVEMENT_PATTERNS) for (const l of p.lifts) m.set(lc(l), p.key);
  return m;
})();

export const patternForExercise = (name) => PATTERN_BY_LIFT.get(lc(name)) ?? null;

// One completed set's load for the Strength Score. Bodyweight-loaded lifts
// add the trainee's bodyweight (assisted reps can push this negative, so
// floor it at a token load).
export function setLoad(name, weightKg, bodyweightKg) {
  const w = Number(weightKg) || 0;
  if (BODYWEIGHT_LOADED.has(lc(name)) && bodyweightKg > 0) {
    return Math.max(5, bodyweightKg + w);
  }
  return w;
}

function tierIndexFor(pattern, e1rm, bodyweightKg, lift) {
  if (pattern.key === "vpull" && BODYWEIGHT_LOADED.has(lc(lift)) && bodyweightKg > 0) {
    const added = e1rm - bodyweightKg;
    let i = 0;
    for (let k = 0; k < PULLUP_SCALE.length; k++) if (added >= PULLUP_SCALE[k]) i = k + 1;
    return i;
  }
  let i = 0;
  for (let k = 0; k < pattern.thresholds.length; k++) if (e1rm >= pattern.thresholds[k]) i = k + 1;
  return i;
}

function nextThresholdFor(pattern, tierIndex, bodyweightKg, lift) {
  if (tierIndex >= 4) return null;
  if (pattern.key === "vpull" && BODYWEIGHT_LOADED.has(lc(lift)) && bodyweightKg > 0) {
    return bodyweightKg + PULLUP_SCALE[tierIndex];
  }
  return pattern.thresholds[tierIndex] ?? null;
}

function prevThresholdFor(pattern, tierIndex, bodyweightKg, lift) {
  if (tierIndex <= 0) return 0;
  if (pattern.key === "vpull" && BODYWEIGHT_LOADED.has(lc(lift)) && bodyweightKg > 0) {
    return bodyweightKg + PULLUP_SCALE[tierIndex - 1];
  }
  return pattern.thresholds[tierIndex - 1] ?? 0;
}

// patternBests: { [patternKey]: { lift, exId, e1rm } } (best per pattern).
export function computeStrengthScore(patternBests = {}, bodyweightKg = 0) {
  const patterns = MOVEMENT_PATTERNS.map((p) => {
    const b = patternBests[p.key];
    if (!b || !(b.e1rm > 0)) {
      return {
        key: p.key, label: p.label, lift: null, exId: null, e1rm: 0,
        tierIndex: 0, tier: null, nextTier: null, toNext: null,
      };
    }
    const ti = tierIndexFor(p, b.e1rm, bodyweightKg, b.lift);
    const nt = nextThresholdFor(p, ti, bodyweightKg, b.lift);
    const pt = prevThresholdFor(p, ti, bodyweightKg, b.lift);
    const within = nt != null && nt > pt ? Math.min(1, Math.max(0, (b.e1rm - pt) / (nt - pt))) : 1;
    return {
      key: p.key,
      label: p.label,
      lift: b.lift,
      exId: b.exId ?? null,
      e1rm: Math.round(b.e1rm),
      tierIndex: ti,
      tier: TIER_NAMES[ti],
      nextTier: ti < 4 ? TIER_NAMES[ti + 1] : null,
      toNext: nt != null ? Math.max(0, Math.round(nt - b.e1rm)) : null,
      // 0 to 1 across the whole Beginner -> Elite scale, for a progress bar.
      barFrac: Math.min(1, Math.max(0, (ti + within) / TIER_NAMES.length)),
    };
  });
  const score = Math.round(patterns.reduce((a, p) => a + p.e1rm, 0));
  const covered = patterns.filter((p) => p.e1rm > 0).length;
  return { score, covered, total: MOVEMENT_PATTERNS.length, patterns };
}
