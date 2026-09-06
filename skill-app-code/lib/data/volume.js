import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_ORDER, MUSCLE_LIST } from "@/lib/exercises";

// Monday of the ISO week containing d, as a YYYY-MM-DD key. Same bucketing
// as the streak math in lib/training.js.
function weekKey(iso) {
  const d = new Date(`${new Date(iso).toISOString().slice(0, 10)}T00:00:00Z`);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.toISOString().slice(0, 10);
}
function addDays(key, n) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// A common working-set range for hypertrophy per muscle per week. Not
// personalised (that is a coaching call); shown as a guide band.
export const WEEKLY_SET_TARGET = { low: 10, high: 20 };

// How much a single set counts toward each muscle it trains. Standard
// fractional-set convention: the muscles doing the work get a full set,
// the assisting muscles get half.
const ROLE_WEIGHT = { primary: 1, secondary: 0.5 };

// Hard sets per muscle this week vs last week, from completed sets and
// their muscle tags (migration 0017). Every set adds 1.0 to each primary
// muscle and 0.5 to each secondary. Two-level: the 6 parent groups roll
// up their specific muscles. Deliberately just "this week" - it is the
// number that drives the next session.
export async function getWeeklyMuscleVolume() {
  const supabase = await createClient();

  const [sessionsRes, setsRes] = await Promise.all([
    supabase.from("workout_sessions").select("id, started_at"),
    supabase
      .from("workout_sets")
      .select("session_id, completed, is_warmup, exercise:exercises(exercise_muscles(role, muscle:muscles(id)))"),
  ]);
  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load volume: ${r.error.message}`);
  }

  const startedAt = new Map((sessionsRes.data ?? []).map((s) => [s.id, s.started_at]));
  const thisWeek = weekKey(new Date().toISOString());
  const lastWeek = addDays(thisWeek, -7);

  // muscle id -> { thisWeek, lastWeek } weighted set totals
  const totals = new Map(MUSCLE_LIST.map((m) => [m.id, { thisWeek: 0, lastWeek: 0 }]));

  for (const s of setsRes.data ?? []) {
    if (s.completed === false || s.is_warmup) continue;
    const at = startedAt.get(s.session_id);
    if (!at) continue;
    const wk = weekKey(at);
    const bucket = wk === thisWeek ? "thisWeek" : wk === lastWeek ? "lastWeek" : null;
    if (!bucket) continue;
    for (const t of s.exercise?.exercise_muscles ?? []) {
      const id = t.muscle?.id;
      if (!id || !totals.has(id)) continue;
      totals.get(id)[bucket] += ROLE_WEIGHT[t.role] ?? 0;
    }
  }

  const round = (v) => Math.round(v * 10) / 10;

  const groups = MUSCLE_ORDER.map((parent) => {
    const muscles = MUSCLE_LIST.filter((m) => m.parent === parent).map((m) => {
      const t = totals.get(m.id) ?? { thisWeek: 0, lastWeek: 0 };
      return { id: m.id, muscle: m.name, thisWeek: round(t.thisWeek), lastWeek: round(t.lastWeek) };
    });
    return {
      parent,
      thisWeek: round(muscles.reduce((n, mm) => n + mm.thisWeek, 0)),
      lastWeek: round(muscles.reduce((n, mm) => n + mm.lastWeek, 0)),
      muscles,
    };
  });

  return {
    groups,
    target: WEEKLY_SET_TARGET,
    trainedThisWeek: groups.some((g) => g.thisWeek > 0),
  };
}
