import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sortMuscles } from "@/lib/exercises";

// Reference data, identical for every user (RLS lets any signed-in user
// read it). Read at request time for now; this is the seam where a
// `use cache` layer goes once a server-only Supabase key exists.
export async function getExercises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle, equipment, instructions, video_url")
    .order("name");

  if (error) throw new Error(`Failed to load exercises: ${error.message}`);
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
