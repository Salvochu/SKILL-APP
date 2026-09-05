import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computeWeekStreak } from "@/lib/training";

// The signed-in user's workout history. RLS scopes every row to auth.uid(),
// so these queries never need an explicit user filter.
export async function getWorkoutSummary() {
  const supabase = await createClient();

  const [sessionsRes, setsRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, started_at, completed_at")
      .order("started_at", { ascending: false }),
    supabase.from("workout_sets").select("reps, weight, completed"),
  ]);

  for (const r of [sessionsRes, setsRes]) {
    if (r.error) throw new Error(`Failed to load workouts: ${r.error.message}`);
  }

  const sessions = sessionsRes.data ?? [];
  const sets = (setsRes.data ?? []).filter((s) => s.completed);

  const volumeKg = sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
  const minutes = sessions.reduce((sum, s) => {
    if (!s.completed_at) return sum;
    return sum + Math.max(0, (new Date(s.completed_at) - new Date(s.started_at)) / 60000);
  }, 0);

  const streak = computeWeekStreak(sessions.map((s) => s.started_at));

  return {
    workouts: sessions.length,
    sets: sets.length,
    volumeKg,
    minutes: Math.round(minutes),
    recent: sessions.slice(0, 5),
    streakWeeks: streak.current,
    longestStreakWeeks: streak.longest,
  };
}
