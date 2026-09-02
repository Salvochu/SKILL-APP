import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sortCategories } from "@/lib/exercises";

// Reference data, identical for every user (RLS lets any signed-in user
// read it). Read at request time for now; this is the seam where a
// `use cache` layer goes once a server-only Supabase key exists.
export async function getExercises() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, category, cue, video_url")
    .order("name");

  if (error) throw new Error(`Failed to load exercises: ${error.message}`);
  return data ?? [];
}

export async function getExercisesByCategory() {
  const exercises = await getExercises();
  const groups = new Map();
  for (const exercise of exercises) {
    if (!groups.has(exercise.category)) groups.set(exercise.category, []);
    groups.get(exercise.category).push(exercise);
  }
  return sortCategories([...groups.keys()]).map((category) => ({
    category,
    exercises: groups.get(category),
  }));
}
