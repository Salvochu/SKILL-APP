import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  MOVEMENT_PATTERNS,
  patternForExercise,
  epley1RM,
  setLoad,
  computeStrengthScore,
} from "@/lib/strength";

const WINDOW_WEEKS = 6;
const WINDOW_MS = WINDOW_WEEKS * 7 * 24 * 60 * 60 * 1000;

// The completed pattern-lift sets from the last six weeks, plus the
// latest logged bodyweight. Shared by the score and its per-session diff.
async function loadWindow(supabase) {
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  const [sessionsRes, bodyRes] = await Promise.all([
    supabase.from("workout_sessions").select("id").gte("started_at", cutoff),
    supabase
      .from("body_logs")
      .select("weight")
      .not("weight", "is", null)
      .order("logged_at", { ascending: false })
      .limit(1),
  ]);
  if (sessionsRes.error) throw new Error(`Failed to load strength score: ${sessionsRes.error.message}`);

  const bodyweightKg = Number(bodyRes.data?.[0]?.weight) || 0;
  const sessionIds = (sessionsRes.data ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return { rows: [], bodyweightKg };

  const { data: sets, error } = await supabase
    .from("workout_sets")
    .select("session_id, weight, reps, completed, is_warmup, exercise:exercises(name)")
    .in("session_id", sessionIds);
  if (error) throw new Error(`Failed to load strength score: ${error.message}`);

  const rows = [];
  for (const s of sets ?? []) {
    if (s.completed === false || s.is_warmup) continue;
    const name = s.exercise?.name;
    if (!patternForExercise(name)) continue;
    rows.push({ sessionId: s.session_id, name, weight: s.weight, reps: s.reps });
  }
  return { rows, bodyweightKg };
}

function scoreFrom(rows, bodyweightKg) {
  const bests = {};
  for (const r of rows) {
    const key = patternForExercise(r.name);
    if (!key) continue;
    const e1 = epley1RM(setLoad(r.name, r.weight, bodyweightKg), r.reps);
    if (!(e1 > 0)) continue;
    if (!bests[key] || e1 > bests[key].e1rm) bests[key] = { lift: r.name, e1rm: e1 };
  }
  return computeStrengthScore(bests, bodyweightKg);
}

// Current Strength Score: best estimated 1RM per movement pattern over
// the last six weeks, summed.
export async function getStrengthScore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { rows, bodyweightKg } = await loadWindow(supabase);
  return { ...scoreFrom(rows, bodyweightKg), bodyweightKg, windowWeeks: WINDOW_WEEKS };
}

// How the just-saved session moved the score.
export async function getStrengthScoreDelta(sessionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !sessionId) return null;

  const { rows, bodyweightKg } = await loadWindow(supabase);
  const after = scoreFrom(rows, bodyweightKg);
  const before = scoreFrom(
    rows.filter((r) => r.sessionId !== sessionId),
    bodyweightKg,
  );
  return {
    before: before.score,
    after: after.score,
    delta: after.score - before.score,
    covered: after.covered,
    patterns: after.patterns,
  };
}

export { MOVEMENT_PATTERNS };
