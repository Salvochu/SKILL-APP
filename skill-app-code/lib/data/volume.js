import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_ORDER, MUSCLE_LIST } from "@/lib/exercises";
import { WEEK_MS, weeksInRange } from "@/lib/dateRange";

// A common working-set range for hypertrophy per muscle per week. Not
// personalised (that is a coaching call); shown as a guide band.
export const WEEKLY_SET_TARGET = { low: 10, high: 20 };

// How much a single set counts toward each muscle it trains. Standard
// fractional-set convention: the muscles doing the work get a full set,
// the assisting muscles get half.
const ROLE_WEIGHT = { primary: 1, secondary: 0.5 };

// Hard sets per muscle from completed sets and their muscle tags
// (migration 0017). Every set adds 1.0 to each primary muscle and 0.5 to
// each secondary. Two-level view: the 6 parent groups roll up their
// specific muscles.
//
// `range` is a resolved range from lib/dateRange. Over a window of 2+
// weeks the numbers are averaged per week (so the 10-20 band still
// applies) and `perWeek` is true; over a single week they are raw totals
// for that week. `lastWeek` compares against the equivalent window
// immediately before.
export async function getWeeklyMuscleVolume(range = {}) {
  const supabase = await createClient();

  const now = new Date();
  const until = range.untilISO ? new Date(range.untilISO) : now;

  const earliestRes = await supabase
    .from("workout_sessions")
    .select("started_at")
    .order("started_at", { ascending: true })
    .limit(1);
  if (earliestRes.error) throw new Error(`Failed to load volume: ${earliestRes.error.message}`);
  const earliestISO = earliestRes.data?.[0]?.started_at ?? null;

  const since = range.sinceISO
    ? new Date(range.sinceISO)
    : new Date(earliestISO ?? until.getTime() - 8 * WEEK_MS);
  const windowMs = Math.max(WEEK_MS, until - since);
  const prevSince = new Date(since.getTime() - windowMs);

  const weeks = weeksInRange({ sinceISO: since.toISOString(), untilISO: until.toISOString() }, earliestISO);
  const perWeek = weeks >= 2;

  const [sessionsRes, setsRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, started_at")
      .gte("started_at", prevSince.toISOString())
      .lte("started_at", until.toISOString()),
    supabase
      .from("workout_sets")
      .select(
        "session_id, completed, exercise:exercises(exercise_muscles(role, muscle:muscles(id)))",
      ),
  ]);
  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load volume: ${r.error.message}`);
  }

  const sessionAt = new Map((sessionsRes.data ?? []).map((s) => [s.id, new Date(s.started_at)]));

  // muscle id -> { now, prev } weighted set totals
  const totals = new Map(MUSCLE_LIST.map((m) => [m.id, { now: 0, prev: 0 }]));

  for (const s of setsRes.data ?? []) {
    if (s.completed === false) continue;
    const at = sessionAt.get(s.session_id);
    if (!at) continue;
    const bucket = at >= since ? "now" : at >= prevSince ? "prev" : null;
    if (!bucket) continue;
    for (const t of s.exercise?.exercise_muscles ?? []) {
      const id = t.muscle?.id;
      if (!id || !totals.has(id)) continue;
      totals.get(id)[bucket] += ROLE_WEIGHT[t.role] ?? 0;
    }
  }

  const scale = perWeek ? 1 / weeks : 1;
  const round = (v) => Math.round(v * 10) / 10;

  const groups = MUSCLE_ORDER.map((parent) => {
    const muscles = MUSCLE_LIST.filter((m) => m.parent === parent).map((m) => {
      const t = totals.get(m.id) ?? { now: 0, prev: 0 };
      return { id: m.id, muscle: m.name, thisWeek: round(t.now * scale), lastWeek: round(t.prev * scale) };
    });
    return {
      parent,
      thisWeek: round(muscles.reduce((n, mm) => n + mm.thisWeek, 0)),
      lastWeek: round(muscles.reduce((n, mm) => n + mm.lastWeek, 0)),
      muscles,
    };
  });

  const totalThisWeek = groups.reduce((n, g) => n + g.thisWeek, 0);

  return {
    groups,
    target: WEEKLY_SET_TARGET,
    trainedThisWeek: totalThisWeek > 0,
    perWeek,
    periodLabel: perWeek
      ? range.token === "all"
        ? "your whole log"
        : (range.label ?? `${weeks} weeks`)
      : null,
  };
}
