import "server-only";
import { createClient } from "@/lib/supabase/server";

// Epley 1RM estimate. Only meaningful in the low-rep range; above ~15
// reps it balloons and stops reflecting strength, so those sets are not
// treated as 1RM data (they still count toward volume elsewhere).
const epley = (w, r) => (w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0);
const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);

// Every completed, loaded set with its session id, date and exercise.
async function loadLoadedSets(supabase) {
  const [sessionsRes, setsRes] = await Promise.all([
    supabase.from("workout_sessions").select("id, started_at"),
    supabase
      .from("workout_sets")
      .select("session_id, exercise_id, reps, weight, completed, is_warmup, exercise:exercises(name, muscle)"),
  ]);
  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load records: ${r.error.message}`);
  }
  const startedAt = new Map((sessionsRes.data ?? []).map((s) => [s.id, s.started_at]));
  return (setsRes.data ?? [])
    .filter(
      (s) => s.completed !== false && !s.is_warmup && Number(s.weight) > 0 && Number(s.reps) > 0,
    )
    .map((s) => ({
      sessionId: s.session_id,
      exerciseId: s.exercise_id,
      name: s.exercise?.name ?? "Exercise",
      muscle: s.exercise?.muscle ?? null,
      weight: Number(s.weight),
      reps: Number(s.reps),
      e1: epley(Number(s.weight), Number(s.reps)),
      date: startedAt.get(s.session_id) ? dayKey(startedAt.get(s.session_id)) : null,
    }));
}

// Best-ever estimated 1RM and heaviest-ever weight per exercise, most
// recent PR first. For the Progress "Personal records" card.
export async function getPersonalRecords() {
  const supabase = await createClient();
  const rows = await loadLoadedSets(supabase);

  const byExercise = new Map();
  for (const s of rows) {
    let rec = byExercise.get(s.exerciseId);
    if (!rec) {
      rec = { name: s.name, muscle: s.muscle, best1rm: 0, best1rmDate: null, topWeight: 0, topWeightReps: 0 };
      byExercise.set(s.exerciseId, rec);
    }
    if (s.e1 > rec.best1rm) {
      rec.best1rm = s.e1;
      rec.best1rmDate = s.date;
    }
    if (s.weight > rec.topWeight || (s.weight === rec.topWeight && s.reps > rec.topWeightReps)) {
      rec.topWeight = s.weight;
      rec.topWeightReps = s.reps;
    }
  }

  return [...byExercise.values()]
    .filter((r) => r.best1rm > 0)
    .map((r) => ({ ...r, best1rm: Math.round(r.best1rm) }))
    .sort(
      (a, b) =>
        String(b.best1rmDate).localeCompare(String(a.best1rmDate)) || b.best1rm - a.best1rm,
    );
}

// Exercises where this session hit a new best estimated 1RM, judged
// against every earlier session. For the post-workout screen.
export async function getSessionPRs(sessionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await loadLoadedSets(supabase);
  if (!rows.some((s) => s.sessionId === sessionId)) return [];

  const bestBefore = new Map(); // exId -> best e1 in any other session
  const thisSession = new Map(); // exId -> { name, e1, weight, reps }
  for (const s of rows) {
    if (s.sessionId === sessionId) {
      const cur = thisSession.get(s.exerciseId);
      if (!cur || s.e1 > cur.e1) thisSession.set(s.exerciseId, { name: s.name, e1: s.e1, weight: s.weight, reps: s.reps });
    } else {
      bestBefore.set(s.exerciseId, Math.max(bestBefore.get(s.exerciseId) ?? 0, s.e1));
    }
  }

  const prs = [];
  for (const [exId, best] of thisSession) {
    if (best.e1 > (bestBefore.get(exId) ?? 0) + 0.01) {
      prs.push({ name: best.name, weight: best.weight, reps: best.reps, e1rm: Math.round(best.e1) });
    }
  }
  return prs;
}
