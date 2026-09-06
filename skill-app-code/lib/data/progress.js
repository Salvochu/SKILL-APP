import "server-only";
import { createClient } from "@/lib/supabase/server";

// Epley 1RM estimate, ignored above ~15 reps where it stops tracking
// strength and just balloons.
const epley = (w, r) => (w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0);
const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

// Everything the Progress page and the dashboard volume card need, computed
// from the user's sessions and sets. RLS scopes both to auth.uid().
// `range` is a resolved range from lib/dateRange (parseRange); when its
// sinceISO/untilISO are set, only sessions started in that window count.
export async function getProgressData(range = {}) {
  const supabase = await createClient();

  let sessionQuery = supabase
    .from("workout_sessions")
    .select("id, title, started_at, completed_at")
    .order("started_at", { ascending: true });
  if (range.sinceISO) sessionQuery = sessionQuery.gte("started_at", range.sinceISO);
  if (range.untilISO) sessionQuery = sessionQuery.lte("started_at", range.untilISO);

  const [sessionsRes, setsRes, earliestRes] = await Promise.all([
    sessionQuery,
    supabase
      .from("workout_sets")
      .select("session_id, exercise_id, reps, weight, completed, exercise:exercises(name)"),
    supabase
      .from("workout_sessions")
      .select("started_at")
      .order("started_at", { ascending: true })
      .limit(1),
  ]);
  for (const r of [sessionsRes, setsRes, earliestRes]) {
    if (r.error) throw new Error(`Failed to load progress: ${r.error.message}`);
  }

  const sessions = sessionsRes.data ?? [];
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const sets = (setsRes.data ?? []).filter((s) => s.completed && sessionById.has(s.session_id));

  // volume per session
  const volBySession = new Map();
  for (const s of sets) {
    const v = (Number(s.weight) || 0) * (Number(s.reps) || 0);
    volBySession.set(s.session_id, (volBySession.get(s.session_id) || 0) + v);
  }
  const sessionVolumes = sessions.map((s) => ({
    id: s.id,
    date: dayKey(s.started_at),
    label: s.title,
    volumeKg: Math.round(volBySession.get(s.id) || 0),
  }));

  // estimated 1RM per exercise per day, from the best set of that day.
  // Bucketed by calendar day, not session: training a lift twice in one
  // day would otherwise plot two points on the same date and draw a
  // vertical line between them.
  const perExercise = new Map(); // exId -> { name, byDay: Map(dayKey -> {best1rm, topWeight, topReps}) }
  for (const s of sets) {
    const w = Number(s.weight) || 0;
    const r = Number(s.reps) || 0;
    if (w <= 0 || r <= 0) continue;
    const e1 = epley(w, r);
    if (e1 <= 0) continue;
    if (!perExercise.has(s.exercise_id)) {
      perExercise.set(s.exercise_id, { name: s.exercise?.name ?? "Exercise", byDay: new Map() });
    }
    const ex = perExercise.get(s.exercise_id);
    const day = dayKey(sessionById.get(s.session_id)?.started_at ?? new Date().toISOString());
    const cur = ex.byDay.get(day);
    if (!cur || e1 > cur.best1rm) {
      ex.byDay.set(day, { best1rm: e1, topWeight: w, topReps: r });
    }
  }

  const exercises = [...perExercise.entries()]
    .map(([id, ex]) => ({
      id,
      name: ex.name,
      points: [...ex.byDay.entries()]
        .map(([date, p]) => ({
          date,
          best1rm: Math.round(p.best1rm),
          topWeight: p.topWeight,
          topReps: p.topReps,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name));

  return {
    workouts: sessions.length,
    totalVolumeKg: Math.round([...volBySession.values()].reduce((a, b) => a + b, 0)),
    sessionVolumes,
    exercises,
    earliestISO: earliestRes.data?.[0]?.started_at ?? null,
  };
}
