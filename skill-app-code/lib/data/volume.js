import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_ORDER } from "@/lib/exercises";

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

// Hard sets per muscle group per week, from completed sets. Returns the
// current week and the previous week, plus a short trailing history per
// muscle for the sparkline. Weeks with no training are still included as
// zeros so the trend does not lie about consistency.
export async function getWeeklyMuscleVolume(weeksBack = 8) {
  const supabase = await createClient();

  const [sessionsRes, setsRes] = await Promise.all([
    supabase.from("workout_sessions").select("id, started_at"),
    supabase
      .from("workout_sets")
      .select("session_id, completed, exercise:exercises(muscle)"),
  ]);
  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load volume: ${r.error.message}`);
  }

  const startedAt = new Map((sessionsRes.data ?? []).map((s) => [s.id, s.started_at]));

  const thisWeek = weekKey(new Date().toISOString());
  const weeks = [];
  for (let i = weeksBack - 1; i >= 0; i--) weeks.push(addDays(thisWeek, -7 * i));
  const weekIndex = new Map(weeks.map((w, i) => [w, i]));

  // muscle -> array aligned with `weeks`
  const counts = new Map(MUSCLE_ORDER.map((m) => [m, weeks.map(() => 0)]));

  for (const s of setsRes.data ?? []) {
    if (s.completed === false) continue;
    const muscle = s.exercise?.muscle;
    if (!muscle || !counts.has(muscle)) continue;
    const at = startedAt.get(s.session_id);
    if (!at) continue;
    const wi = weekIndex.get(weekKey(at));
    if (wi == null) continue;
    counts.get(muscle)[wi] += 1;
  }

  const last = weeks.length - 1;
  const muscles = MUSCLE_ORDER.map((muscle) => {
    const series = counts.get(muscle);
    return {
      muscle,
      thisWeek: series[last],
      lastWeek: last > 0 ? series[last - 1] : 0,
      history: series,
    };
  });

  const totalThisWeek = muscles.reduce((n, m) => n + m.thisWeek, 0);
  const trainedThisWeek = muscles.some((m) => m.thisWeek > 0);

  return { muscles, weeks, totalThisWeek, trainedThisWeek, target: WEEKLY_SET_TARGET };
}
