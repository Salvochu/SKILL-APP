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

// The user's current Strength Score: the best estimated 1RM in each of the
// six movement patterns over the last six weeks, summed. RLS scopes every
// query to auth.uid().
export async function getStrengthScore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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

  let bests = {};
  if (sessionIds.length > 0) {
    const { data: sets, error } = await supabase
      .from("workout_sets")
      .select("weight, reps, completed, exercise:exercises(name)")
      .in("session_id", sessionIds);
    if (error) throw new Error(`Failed to load strength score: ${error.message}`);

    for (const s of sets ?? []) {
      if (s.completed === false) continue;
      const name = s.exercise?.name;
      const key = patternForExercise(name);
      if (!key) continue;
      const e1 = epley1RM(setLoad(name, s.weight, bodyweightKg), s.reps);
      if (!(e1 > 0)) continue;
      if (!bests[key] || e1 > bests[key].e1rm) bests[key] = { lift: name, e1rm: e1 };
    }
  }

  return {
    ...computeStrengthScore(bests, bodyweightKg),
    bodyweightKg,
    windowWeeks: WINDOW_WEEKS,
  };
}

export { MOVEMENT_PATTERNS };
