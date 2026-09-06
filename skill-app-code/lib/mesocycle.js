// Pure mesocycle math. No server-only import, safe in Server and Client
// Components alike, same convention as lib/training.js. Everything here
// is computed from a start date rather than stored per week, so there is
// nothing to keep in sync when someone runs behind or ahead of schedule.

const dayKeyOf = (d) => new Date(d).toISOString().slice(0, 10);

function shiftDate(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysSinceStart(startDate, today) {
  const start = new Date(`${dayKeyOf(startDate)}T00:00:00Z`);
  const now = new Date(`${dayKeyOf(today)}T00:00:00Z`);
  return Math.floor((now - start) / 86400000);
}

// [from, to) date range for a given 1-based week of a run, used to count
// how many sessions were logged within that specific week (the "week
// progress" bar) rather than across the whole run.
export function weekDateRange(startDate, week) {
  const from = shiftDate(dayKeyOf(startDate), (week - 1) * 7);
  const to = shiftDate(from, 7);
  return { from, to };
}

// 1-based week number for `today`, clamped to [1, weeks] so a run that
// has gone past its end (or a defensive future start date) still
// returns something sane rather than an out-of-range week.
export function currentWeek(startDate, weeks, today = new Date()) {
  const week = Math.floor(daysSinceStart(startDate, today) / 7) + 1;
  return Math.min(weeks, Math.max(1, week));
}

export function isMesocycleComplete(startDate, weeks, today = new Date()) {
  return daysSinceStart(startDate, today) >= weeks * 7;
}

// The final week of every mesocycle is a deload.
export function isDeloadWeek(week, weeks) {
  return week >= weeks;
}

// Linear step from startingRir down to 0 across the training weeks
// (every week except the deload). The deload week is always a fixed,
// easy target regardless of the curve. Rounded to the nearest half, RIR
// finer than that is not meaningfully distinguishable in practice.
export function rirForWeek(week, weeks, startingRir = 3) {
  if (isDeloadWeek(week, weeks)) return 4;
  const trainingWeeks = Math.max(1, weeks - 1);
  if (trainingWeeks === 1) return startingRir;
  const step = startingRir / (trainingWeeks - 1);
  const rir = startingRir - step * (week - 1);
  return Math.max(0, Math.round(rir * 2) / 2);
}

// Deload halves the prescribed sets, rounded up so a 1-set exercise
// never drops to 0.
export function setsForWeek(baseSets, week, weeks) {
  if (!isDeloadWeek(week, weeks)) return baseSets;
  return Math.max(1, Math.ceil(baseSets / 2));
}

// Plain-language guidance for the week you are in: what to aim for on
// every set. Derived from the week number so there is nothing to author
// per template. `headline` is a short chip; `detail` is a sentence.
export function weekGuidance(week, weeks, startingRir = 3) {
  if (isDeloadWeek(week, weeks)) {
    return {
      headline: "Deload week",
      detail:
        "Half the sets, drop the weight by a third or so, and keep 4 to 5 reps in reserve. This week is for recovery, not progress.",
    };
  }
  if (week === 1) {
    return {
      headline: "Baseline week",
      detail:
        `Leave about ${startingRir} reps in the tank on every set. Pick weights you are sure of. These numbers become your reference for the whole block.`,
    };
  }
  const rir = rirForWeek(week, weeks, startingRir);
  const trainingWeeks = Math.max(1, weeks - 1);
  const last = week === trainingWeeks;
  return {
    headline: last ? "Last hard week" : `Beat last week`,
    detail: last
      ? `Everything you have. Match or beat last week's reps with 0 to 1 left in reserve, then you deload.`
      : `Add a rep or two per set, or a little weight, versus last week. Aim for about ${rir} rep${rir === 1 ? "" : "s"} in reserve.`,
  };
}

// Weekly-session options implied by a split's cadence string. A range
// ("2-3x per week") returns [2, 3] so the user is asked to pick; a fixed
// count ("5 days") returns [] and the split's own day count is used.
export function sessionOptionsFromCadence(cadence) {
  const nums = (String(cadence || "").match(/\d+/g) || []).map(Number).filter((n) => n > 0);
  if (nums.length < 2) return [];
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const out = [];
  for (let n = lo; n <= hi && out.length < 8; n++) out.push(n);
  return out;
}

// 0-based position in the split's day sequence that comes next, given
// how many sessions have already been logged against this mesocycle
// run. Cycles through the split's own days in order, independent of
// which calendar days they fall on.
export function nextDayIndex(sessionsLoggedSoFar, totalDays) {
  if (totalDays <= 0) return 0;
  return sessionsLoggedSoFar % totalDays;
}
