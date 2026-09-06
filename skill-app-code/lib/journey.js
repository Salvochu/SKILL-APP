// Journey Level: a lifetime progression that only ever goes up. XP comes
// from showing up over time (workouts, consistent weeks, strength PRs,
// finished programs, body check-ins) - never from daily streaks, and
// nothing is ever taken away. Pure; safe on server and client.

export const XP = {
  workout: 12,
  consistentWeek: 25,
  patternPR: 40,
  mesocycle: 60,
  bodyCheckIn: 5,
};

export const MAX_LEVEL = 100;
const K = 15;
const P = 1.5;

// Cumulative XP needed to reach a level. Tuned so level 100 lands near
// 15,000 XP - about three years of training three times a week.
export function xpForLevel(level) {
  const L = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return Math.round(K * L ** P);
}

// The level a given XP total sits at.
export function levelForXp(xp) {
  const x = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor((x / K) ** (2 / 3))));
}

// Seven colour-coded tiers across the 100 levels. Colours are also
// registered as CSS tokens (--tier-*) in globals.css.
export const TIERS = [
  { name: "Steel", min: 1, max: 14, color: "#8b909a" },
  { name: "Bronze", min: 15, max: 29, color: "#c07d3e" },
  { name: "Sapphire", min: 30, max: 44, color: "#3f86d9" },
  { name: "Emerald", min: 45, max: 59, color: "#28a76a" },
  { name: "Amethyst", min: 60, max: 74, color: "#9b6dd6" },
  { name: "Ruby", min: 75, max: 89, color: "#db3b52" },
  { name: "Diamond", min: 90, max: 100, color: "#63d6ea" },
];

export function tierForLevel(level) {
  const L = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return TIERS.find((t) => L >= t.min && L <= t.max) ?? TIERS[0];
}

// Everything the UI needs to draw the level: current level, its tier, and
// how far into the level the XP total is.
export function journeyProgress(xp) {
  const x = Math.max(0, Math.round(Number(xp) || 0));
  const level = levelForXp(x);
  const tier = tierForLevel(level);
  const atMax = level >= MAX_LEVEL;
  const floor = xpForLevel(level);
  const ceil = atMax ? floor : xpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  const into = Math.max(0, x - floor);
  const tierIdx = TIERS.indexOf(tier);
  return {
    xp: x,
    level,
    maxLevel: MAX_LEVEL,
    atMax,
    tier: tier.name,
    tierColor: tier.color,
    nextTier: tierIdx >= 0 && tierIdx < TIERS.length - 1 ? TIERS[tierIdx + 1] : null,
    xpIntoLevel: into,
    xpToNextLevel: atMax ? 0 : Math.max(0, ceil - x),
    pctToNextLevel: atMax ? 100 : Math.min(100, Math.round((into / span) * 100)),
  };
}
