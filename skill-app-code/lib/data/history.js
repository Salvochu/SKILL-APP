import "server-only";
import { createClient } from "@/lib/supabase/server";

// For every exercise the user has ever logged, the sets from the most
// recent session that included it. Keyed by exercise id. The Log screen
// uses this for the "last time" readout and the next-target suggestion.
//
// One query over the user's sets (RLS-scoped). Fine at launch volume; if
// a user's history grows into the thousands of sets, swap this for a
// "latest set per exercise" view.
export async function getRecentPerformance() {
  const supabase = await createClient();
  const { data: raw, error } = await supabase
    .from("workout_sets")
    .select(
      "exercise_id, set_number, reps, weight, rir, completed, is_warmup, session:workout_sessions!inner(id, started_at)",
    );
  if (error) throw new Error(`Failed to load history: ${error.message}`);

  // The "last time" readout is about working sets, so warm-ups are left out.
  const data = (raw ?? []).filter((r) => !r.is_warmup);

  // Pass 1: find the latest session per exercise.
  const latest = new Map(); // exerciseId -> { sessionId, startedAt }
  for (const row of data ?? []) {
    const s = row.session;
    if (!s?.started_at) continue;
    const cur = latest.get(row.exercise_id);
    if (!cur || s.started_at > cur.startedAt) {
      latest.set(row.exercise_id, { sessionId: s.id, startedAt: s.started_at });
    }
  }

  // Pass 2: collect that session's sets.
  const out = {};
  for (const row of data ?? []) {
    const win = latest.get(row.exercise_id);
    if (!win || row.session?.id !== win.sessionId) continue;
    (out[row.exercise_id] ||= { date: win.startedAt.slice(0, 10), sets: [] }).sets.push({
      setNumber: row.set_number,
      weight: row.weight == null ? null : Number(row.weight),
      reps: row.reps == null ? null : Number(row.reps),
      rir: row.rir == null ? null : Number(row.rir),
      completed: row.completed !== false,
    });
  }
  for (const entry of Object.values(out)) {
    entry.sets.sort((a, b) => a.setNumber - b.setNumber);
  }
  return out;
}
