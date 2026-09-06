import "server-only";
import { createClient } from "@/lib/supabase/server";

const epley = (w, r) => (w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0);

// Every session the signed-in user has logged that included `exerciseId`,
// newest first. Each session carries its sets (weight in kg, reps, rir)
// and that day's best estimated 1RM. `limit` caps the number of sessions
// returned; pass null for all of them. Also returns the all-time best
// e1RM and top weight for the header.
export async function getExerciseHistory(exerciseId, { limit = null } = {}) {
  const supabase = await createClient();
  if (!exerciseId) return { sessions: [], best1rmKg: 0, topWeightKg: 0, count: 0 };

  const { data, error } = await supabase
    .from("workout_sets")
    .select("set_number, reps, weight, rir, completed, is_warmup, session:workout_sessions!inner(id, title, started_at)")
    .eq("exercise_id", exerciseId);
  if (error) throw new Error(`Failed to load exercise history: ${error.message}`);

  const bySession = new Map();
  for (const row of data ?? []) {
    const s = row.session;
    if (!s?.id || row.is_warmup) continue;
    if (!bySession.has(s.id)) {
      bySession.set(s.id, { id: s.id, title: s.title, date: s.started_at, sets: [] });
    }
    bySession.get(s.id).sets.push({
      setNumber: row.set_number,
      weight: row.weight == null ? null : Number(row.weight),
      reps: row.reps == null ? null : Number(row.reps),
      rir: row.rir == null ? null : Number(row.rir),
      completed: row.completed !== false,
    });
  }

  let sessions = [...bySession.values()].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sessions) {
    s.sets.sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0));
    s.best1rmKg = Math.round(Math.max(0, ...s.sets.map((x) => epley(Number(x.weight) || 0, Number(x.reps) || 0))));
  }

  const best1rmKg = Math.max(0, ...sessions.map((s) => s.best1rmKg));
  const topWeightKg = Math.max(
    0,
    ...sessions.flatMap((s) => s.sets.map((x) => Number(x.weight) || 0)),
  );
  const count = sessions.length;
  if (limit) sessions = sessions.slice(0, limit);

  return { sessions, best1rmKg, topWeightKg, count };
}
