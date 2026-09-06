import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sortMuscles } from "@/lib/exercises";

const BASE_COLS = "id, name, muscle, equipment, instructions, video_url";
const MUSCLE_JOIN = "exercise_muscles(role, muscle:muscles(id, name, parent, position))";

// Flattens the nested exercise_muscles join into a plain `muscles` array on
// each row: [{ id, name, parent, position, role }], primary tags first then
// by anatomical position. Leaves a `muscles: []` when there are no tags.
function withMuscles(rows) {
  return (rows ?? []).map((row) => {
    const tags = (row.exercise_muscles ?? [])
      .filter((t) => t.muscle)
      .map((t) => ({
        id: t.muscle.id,
        name: t.muscle.name,
        parent: t.muscle.parent,
        position: t.muscle.position ?? 0,
        role: t.role,
      }))
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
        return a.position - b.position;
      });
    const { exercise_muscles, ...rest } = row;
    return { ...rest, muscles: tags };
  });
}

// Fetches library rows for one category with their muscle tags. Falls back
// gracefully: without the muscle join if migration 0017 has not run, then
// without the category filter if 0009 has not run either.
async function fetchLibrary(category) {
  const supabase = await createClient();

  const full = await supabase
    .from("exercises")
    .select(`${BASE_COLS}, ${MUSCLE_JOIN}`)
    .eq("category", category)
    .order("name");
  if (!full.error) return withMuscles(full.data);

  const noJoin = await supabase
    .from("exercises")
    .select(BASE_COLS)
    .eq("category", category)
    .order("name");
  if (!noJoin.error) return withMuscles(noJoin.data);

  return { error: full.error };
}

// Reference data, identical for every user (RLS lets any signed-in user
// read it). Read at request time for now; this is the seam where a
// `use cache` layer goes once a server-only Supabase key exists.
export async function getExercises() {
  const rows = await fetchLibrary("exercise");
  if (!rows.error) return rows;

  // Before migration 0009 there is no category column: fall back to the
  // whole table (every row is an exercise at that point).
  const supabase = await createClient();
  const retry = await supabase.from("exercises").select(BASE_COLS).order("name");
  if (retry.error) throw new Error(`Failed to load exercises: ${retry.error.message}`);
  return withMuscles(retry.data);
}

// Stretches live in the same table as exercises (same shape: muscles, a
// cue, a Loom clip), separated by category. Kept out of getExercises so
// they never appear in the workout logger's exercise picker. Degrades to
// an empty list rather than throwing, so the Stretching Library still
// renders before migration 0009 has been applied.
export async function getStretches() {
  const rows = await fetchLibrary("stretch");
  return rows.error ? [] : rows;
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
