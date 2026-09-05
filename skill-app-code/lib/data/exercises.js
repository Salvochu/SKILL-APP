import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sortMuscles } from "@/lib/exercises";

// Reference data, identical for every user (RLS lets any signed-in user
// read it). Read at request time for now; this is the seam where a
// `use cache` layer goes once a server-only Supabase key exists.
export async function getExercises() {
  const supabase = await createClient();
  const cols = "id, name, muscle, equipment, instructions, video_url";
  const { data, error } = await supabase
    .from("exercises")
    .select(cols)
    .eq("category", "exercise")
    .order("name");

  // Before migration 0009 there is no category column: fall back to the
  // whole table (every row is an exercise at that point).
  if (error) {
    const retry = await supabase.from("exercises").select(cols).order("name");
    if (retry.error) throw new Error(`Failed to load exercises: ${retry.error.message}`);
    return retry.data ?? [];
  }
  return data ?? [];
}

// Stretches live in the same table as exercises (same shape: a muscle, a
// cue, a Loom clip), separated by category. Kept out of getExercises so
// they never appear in the workout logger's exercise picker. Degrades to
// an empty list rather than throwing, so the Stretching Library still
// renders before migration 0009 has been applied.
export async function getStretches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle, equipment, instructions, video_url")
    .eq("category", "stretch")
    .order("name");

  if (error) return [];
  return data ?? [];
}

export async function getExercisesByMuscle() {
  const exercises = await getExercises();
  const groups = new Map();
  for (const exercise of exercises) {
    if (!groups.has(exercise.muscle)) groups.set(exercise.muscle, []);
    groups.get(exercise.muscle).push(exercise);
  }
  return sortMuscles([...groups.keys()]).map((muscle) => ({
    muscle,
    exercises: groups.get(muscle),
  }));
}
