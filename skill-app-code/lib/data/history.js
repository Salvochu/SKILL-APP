import "server-only";
import { getServerSupabase } from "@/lib/data/session";

// For every exercise the user has ever logged, the sets from the most
// recent session that included it. Keyed by exercise id. The Log screen
// uses this for the "last time" readout and the next-target suggestion.
//
// Bounded to the most recent 60 sessions (walked newest-first, using the
// user_id/started_at index) rather than scanning every set the user has
// ever logged. 60 sessions comfortably covers every exercise still in
// rotation; something last done further back than that shows no "last
// time" hint, same as a brand-new exercise.
export async function getRecentPerformance() {
  const supabase = await getServerSupabase();
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, started_at, workout_sets(exercise_id, set_number, reps, weight, rir, completed, is_warmup)",
    )
    .order("started_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Failed to load history: ${error.message}`);

  // Sessions arrive newest-first, so the first session a given exercise
  // shows up in is its latest one; rows for that exercise from any older
  // session in the batch are skipped.
  const chosenSession = new Map(); // exerciseId -> sessionId
  const out = {};
  for (const session of sessions ?? []) {
    for (const row of session.workout_sets ?? []) {
      // The "last time" readout is about working sets, so warm-ups are left out.
      if (row.is_warmup) continue;
      const known = chosenSession.get(row.exercise_id);
      if (known === undefined) chosenSession.set(row.exercise_id, session.id);
      else if (known !== session.id) continue;

      (out[row.exercise_id] ||= { date: session.started_at.slice(0, 10), sets: [] }).sets.push({
        setNumber: row.set_number,
        weight: row.weight == null ? null : Number(row.weight),
        reps: row.reps == null ? null : Number(row.reps),
        rir: row.rir == null ? null : Number(row.rir),
        completed: row.completed !== false,
      });
    }
  }
  for (const entry of Object.values(out)) {
    entry.sets.sort((a, b) => a.setNumber - b.setNumber);
  }
  return out;
}
