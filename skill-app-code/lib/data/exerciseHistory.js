import "server-only";
import { getServerSupabase } from "@/lib/data/session";

const epley = (w, r) => (w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0);

// Every session the signed-in user has logged that included `exerciseId`,
// newest first. Each session carries its sets (weight in kg, reps, rir)
// and that day's best estimated 1RM. `limit` caps the number of sessions
// returned; pass null for all of them. Also returns the all-time best
// e1RM and top weight for the header, and the true total session count
// (not capped by `limit`) so a bounded call can still say "N sessions".
//
// Queries workout_sessions (not workout_sets) so the started_at index
// does the ordering and, when `limit` is set, the database does the
// capping too, instead of fetching every set the user has ever logged
// for this exercise and slicing in JS. `limit: null` (the exercise
// library's full-history view) still reads everything, since it needs
// the real all-time best and the full list either way.
export async function getExerciseHistory(exerciseId, { limit = null } = {}) {
  const supabase = await getServerSupabase();
  if (!exerciseId) return { sessions: [], best1rmKg: 0, topWeightKg: 0, count: 0 };

  let query = supabase
    .from("workout_sessions")
    .select(
      "id, title, started_at, workout_sets!inner(set_number, reps, weight, rir, completed, is_warmup, exercise_id)",
      { count: "exact" },
    )
    .eq("workout_sets.exercise_id", exerciseId)
    .order("started_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load exercise history: ${error.message}`);

  const sessions = (data ?? []).map((s) => {
    const sets = (s.workout_sets ?? [])
      .filter((row) => !row.is_warmup)
      .map((row) => ({
        setNumber: row.set_number,
        weight: row.weight == null ? null : Number(row.weight),
        reps: row.reps == null ? null : Number(row.reps),
        rir: row.rir == null ? null : Number(row.rir),
        completed: row.completed !== false,
      }))
      .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0));
    const best1rmKg = Math.round(Math.max(0, ...sets.map((x) => epley(Number(x.weight) || 0, Number(x.reps) || 0))));
    return { id: s.id, title: s.title, date: s.started_at, sets, best1rmKg };
  });

  // Best-ever numbers only cover the sessions actually fetched: exact
  // over the full history (limit: null), the visible window otherwise
  // (today's one caller of a bounded fetch doesn't read these two).
  const best1rmKg = Math.max(0, ...sessions.map((s) => s.best1rmKg));
  const topWeightKg = Math.max(
    0,
    ...sessions.flatMap((s) => s.sets.map((x) => Number(x.weight) || 0)),
  );

  return { sessions, best1rmKg, topWeightKg, count: count ?? sessions.length };
}
