// Pure training-math helpers. No server-only imports: safe in Server and
// Client Components alike.

// Parse a prescribed rep target ("8-12", "10", "8 - 12", "12+") into
// { low, high }. Returns null when there is no usable number.
export function parseRepRange(str) {
  if (str == null) return null;
  const m = String(str).match(/(\d+)\s*(?:-|to|–)?\s*(\d+)?/i);
  if (!m || !m[1]) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  if (!Number.isFinite(a) || a <= 0) return null;
  return { low: Math.min(a, b), high: Math.max(a, b) };
}

// Smallest weight jump that makes sense for a piece of equipment, in kg.
export function weightStepFor(equipment) {
  switch (String(equipment || "").toLowerCase()) {
    case "machine":
      return 5;
    case "bodyweight":
      return 0;
    default:
      return 2.5; // barbell, dumbbell, cable
  }
}

const roundTo = (n, step) => (step > 0 ? Math.round(n / step) * step : Math.round(n));

// Pick the hardest set from a session: heaviest, then most reps.
export function topSet(sets) {
  const done = (sets || []).filter(
    (s) => s.weight != null && s.reps != null && s.completed !== false,
  );
  if (done.length === 0) return null;
  return done.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
  );
}

// Double progression: fill the rep range at the target effort, then add
// load and drop back to the bottom of the range. Without a range, just
// aim to beat last time by a rep. `last` is the array of last session's
// sets for this exercise.
export function suggestTarget({ last, repRange, targetRir = 2, equipment } = {}) {
  const top = topSet(last);
  if (!top) return null;

  const step = weightStepFor(equipment);
  const enoughEffort = top.rir == null || top.rir <= targetRir;

  if (repRange) {
    if (top.reps >= repRange.high && enoughEffort && step > 0) {
      return {
        weight: roundTo(top.weight + step, step),
        reps: repRange.low,
        reason: "add load",
      };
    }
    const reps = Math.min(repRange.high, Math.max(repRange.low, top.reps + 1));
    return { weight: top.weight, reps, reason: "add a rep" };
  }

  return { weight: top.weight, reps: top.reps + 1, reason: "beat last time" };
}

// "100 x 10 @2" style summary of a set.
export function formatSet(s) {
  if (s == null) return "";
  const w = s.weight == null ? "BW" : String(Number(s.weight));
  const r = s.reps == null ? "?" : s.reps;
  const rir = s.rir == null ? "" : ` @${s.rir}`;
  return `${w} x ${r}${rir}`;
}

const dayKeyOf = (d) => new Date(d).toISOString().slice(0, 10);
function shiftDay(dateKey, delta) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Current and longest streak of distinct calendar days with a logged
// session. The current streak stays alive through "today" as long as
// yesterday had a session, it does not zero out the instant midnight
// passes with nothing logged yet today. Dates are bucketed by UTC day,
// matching the rest of the app's date handling.
export function computeStreak(sessionDates, today = new Date()) {
  const days = new Set((sessionDates || []).filter(Boolean).map(dayKeyOf));
  if (days.size === 0) return { current: 0, longest: 0 };

  const todayKey = dayKeyOf(today);
  const yesterdayKey = shiftDay(todayKey, -1);

  let current = 0;
  let cursor = days.has(todayKey) ? todayKey : days.has(yesterdayKey) ? yesterdayKey : null;
  while (cursor && days.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of [...days].sort()) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest };
}
