import "server-only";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { MUSCLE_ORDER } from "@/lib/exercises";

// The user's custom workouts, newest-touched first, each with its ordered
// exercise list joined to the library row. RLS already scopes these to
// the owner; the explicit user_id filter just makes that obvious.
export async function getMyWorkouts() {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await getServerSupabase();

  let { data, error } = await supabase
    .from("my_workouts")
    .select(
      "id, name, note, group_name, updated_at, exercises:my_workout_exercises(position, sets, reps, exercise:exercises(id, name, muscle, equipment, video_url, instructions))",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error && isMissingGroupColumn(error)) {
    // Migration 0045 not run yet: behave as if nothing is grouped.
    ({ data, error } = await supabase
      .from("my_workouts")
      .select(
        "id, name, note, updated_at, exercises:my_workout_exercises(position, sets, reps, exercise:exercises(id, name, muscle, equipment, video_url, instructions))",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }));
  }

  if (error) {
    // Table not there yet (migration 0032 not run): behave as "none".
    if (isMissingRelation(error)) return [];
    throw new Error(`Failed to load your workouts: ${error.message}`);
  }

  const lastLogged = await getLastLoggedDates(
    supabase,
    user.id,
    (data ?? []).map((w) => w.id),
  );
  return (data ?? []).map((w) => shape(w, lastLogged.get(w.id) ?? null));
}

// Most recent started_at per my_workout_id, for the "Last logged" line on
// each card. One query for every workout at once rather than N+1: sessions
// come back newest-first, so the first one seen per workout is its latest.
async function getLastLoggedDates(supabase, userId, workoutIds) {
  const map = new Map();
  if (!workoutIds.length) return map;

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("my_workout_id, started_at")
    .eq("user_id", userId)
    .in("my_workout_id", workoutIds)
    .order("started_at", { ascending: false });

  if (error) return map; // non-fatal - cards just show no "last logged" line
  for (const row of data ?? []) {
    if (!map.has(row.my_workout_id)) map.set(row.my_workout_id, row.started_at);
  }
  return map;
}

// One custom workout by id, owner-scoped. null if not found or not
// theirs. Used by the builder (edit) and the logger preload.
export async function getMyWorkout(id) {
  if (!id) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("my_workouts")
    .select(
      "id, name, note, updated_at, user_id, exercises:my_workout_exercises(position, sets, reps, exercise:exercises(id, name, muscle, equipment, video_url, instructions))",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(`Failed to load that workout: ${error.message}`);
  }
  return data ? shape(data) : null;
}

function shape(row, lastLoggedAt = null) {
  const exercises = (row.exercises ?? [])
    .filter((e) => e.exercise)
    .sort((a, b) => a.position - b.position)
    .map((e) => ({
      exerciseId: e.exercise.id,
      exercise: e.exercise,
      name: e.exercise.name,
      muscle: e.exercise.muscle,
      sets: e.sets ?? 3,
      reps: e.reps ?? "",
    }));

  // A short "Chest, Back, Arms" summary for the card, in the app's usual
  // muscle order.
  const groups = [...new Set(exercises.map((e) => e.muscle).filter(Boolean))].sort(
    (a, b) => MUSCLE_ORDER.indexOf(a) - MUSCLE_ORDER.indexOf(b),
  );

  return {
    id: row.id,
    name: row.name,
    note: row.note ?? "",
    updatedAt: row.updated_at,
    exercises,
    muscleSummary: groups.join(", "),
    lastLoggedAt,
    groupName: row.group_name ?? null,
  };
}

function isMissingGroupColumn(error) {
  return error?.code === "42703" && /group_name/i.test(error?.message ?? "");
}

function isMissingRelation(error) {
  return (
    error?.code === "42P01" ||
    /relation .*(my_workouts|my_workout_exercises).* does not exist/i.test(error?.message ?? "")
  );
}
