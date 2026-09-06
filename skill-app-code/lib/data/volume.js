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

// Hard sets per muscle per week, from completed sets and their muscle
// tags (migration 0017). Every set adds 1.0 to each primary muscle and
// 0.5 to each secondary. Returns a two-level view: the 6 parent groups,
// each with its specific muscles, both carrying this week / last week /
// an 8-week trail for the sparkline. Muscles with no sets are still
// included as zeros so the trend does not lie about neglect.
export async function getWeeklyMuscleVolume(weeksBack = 8) {
  const supabase = await createClient();

  const [sessionsRes, setsRes] = await Promise.all([
    supabase.from("workout_sessions").select("id, started_at"),
    supabase
      .from("workout_sets")
      .select(
        "session_id, completed, exercise:exercises(muscle, exercise_muscles(role, muscle:muscles(id)))",
      ),
  ]);
  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load volume: ${r.error.message}`);
  }

  const startedAt = new Map((sessionsRes.data ?? []).map((s) => [s.id, s.started_at]));

  const thisWeek = weekKey(new Date().toISOString());
  const weeks = [];
  for (let i = weeksBack - 1; i >= 0; i--) weeks.push(addDays(thisWeek, -7 * i));
  const weekIndex = new Map(weeks.map((w, i) => [w, i]));

  // muscle id -> array of weekly counts, aligned with `weeks`
  const counts = new Map(MUSCLE_LIST.map((m) => [m.id, weeks.map(() => 0)]));

  for (const s of setsRes.data ?? []) {
    if (s.completed === false) continue;
    const at = startedAt.get(s.session_id);
    if (!at) continue;
    const wi = weekIndex.get(weekKey(at));
    if (wi == null) continue;

    const tags = s.exercise?.exercise_muscles ?? [];
    for (const t of tags) {
      const id = t.muscle?.id;
      if (!id || !counts.has(id)) continue;
      counts.get(id)[wi] += ROLE_WEIGHT[t.role] ?? 0;
    }
  }

  const last = weeks.length - 1;
  const zeros = weeks.map(() => 0);

  const groups = MUSCLE_ORDER.map((parent) => {
    const muscles = MUSCLE_LIST.filter((m) => m.parent === parent).map((m) => {
      const series = counts.get(m.id) ?? zeros;
      return {
        id: m.id,
        muscle: m.name,
        thisWeek: series[last],
        lastWeek: last > 0 ? series[last - 1] : 0,
        history: series,
      };
    });
    const history = weeks.map((_, i) => muscles.reduce((n, mm) => n + mm.history[i], 0));
    return {
      parent,
      thisWeek: history[last],
      lastWeek: last > 0 ? history[last - 1] : 0,
      history,
      muscles,
    };
  });

  const totalThisWeek = groups.reduce((n, g) => n + g.thisWeek, 0);
  const trainedThisWeek = totalThisWeek > 0;

  return { groups, weeks, totalThisWeek, trainedThisWeek, target: WEEKLY_SET_TARGET };
}
