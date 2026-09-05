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

// One past session in full: every exercise and set logged against it,
// grouped in the order they were first added, plus the effort rating
// and notes. Null if it does not exist or belongs to someone else (RLS
// would already block the read, this just makes the "not found" case
// explicit for the page to redirect on).
export async function getWorkoutDetail(sessionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, title, started_at, completed_at, notes, perceived_effort")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (sessionError) throw new Error(`Failed to load workout: ${sessionError.message}`);
  if (!session) return null;

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("exercise_id, set_number, reps, weight, rir, completed, note, exercise:exercises(id, name, muscle)")
    .eq("session_id", sessionId)
    .order("set_number");
  if (setsError) throw new Error(`Failed to load workout sets: ${setsError.message}`);

  const byExercise = new Map();
  for (const s of sets ?? []) {
    if (!byExercise.has(s.exercise_id)) {
      byExercise.set(s.exercise_id, { exercise: s.exercise, note: null, sets: [] });
    }
    const entry = byExercise.get(s.exercise_id);
    if (s.set_number === 1 && s.note) entry.note = s.note;
    entry.sets.push({
      setNumber: s.set_number,
      weight: s.weight == null ? null : Number(s.weight),
      reps: s.reps,
      rir: s.rir,
      completed: s.completed !== false,
    });
  }

  const exercises = [...byExercise.values()];
  const volumeKg = exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce(
        (s, set) => s + (set.completed ? (Number(set.weight) || 0) * (Number(set.reps) || 0) : 0),
        0,
      ),
    0,
  );
  const durationMin = session.completed_at
    ? Math.max(0, Math.round((new Date(session.completed_at) - new Date(session.started_at)) / 60000))
    : null;

  return {
    id: session.id,
    title: session.title,
    date: session.started_at,
    durationMin,
    notes: session.notes,
    perceivedEffort: session.perceived_effort,
    volumeKg: Math.round(volumeKg),
    exercises,
  };
}
