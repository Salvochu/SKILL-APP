"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";

// Create / edit / duplicate / delete a custom "my workout". Exercises are
// stored as a fresh ordered set every save (delete then insert), which
// keeps the write simple and the positions always contiguous. RLS scopes
// every table to the owner; the explicit user_id checks make it obvious.

const MAX_EXERCISES = 40;
const MAX_SETS = 20;

function cleanName(v) {
  return String(v || "").trim().slice(0, 80);
}

function cleanExercises(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.exerciseId === "string" && e.exerciseId)
    .slice(0, MAX_EXERCISES)
    .map((e, i) => {
      const sets = Math.max(1, Math.min(MAX_SETS, Math.round(Number(e.sets) || 3)));
      const reps = String(e.reps ?? "").trim().slice(0, 12) || null;
      return { position: i, exercise_id: e.exerciseId, sets, reps };
    });
}

async function writeExercises(supabase, workoutId, rows) {
  await supabase.from("my_workout_exercises").delete().eq("my_workout_id", workoutId);
  if (rows.length === 0) return null;
  const { error } = await supabase
    .from("my_workout_exercises")
    .insert(rows.map((r) => ({ ...r, my_workout_id: workoutId })));
  return error ?? null;
}

export async function createMyWorkout({ name, note, exercises } = {}) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const cleanedName = cleanName(name) || "My workout";
  const rows = cleanExercises(exercises);
  if (rows.length === 0) return { error: "Add at least one exercise." };

  const { data: created, error } = await supabase
    .from("my_workouts")
    .insert({ user_id: user.id, name: cleanedName, note: cleanNote(note) })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const exError = await writeExercises(supabase, created.id, rows);
  if (exError) {
    await supabase.from("my_workouts").delete().eq("id", created.id);
    return { error: exError.message };
  }

  revalidatePath("/splits");
  return { ok: true, id: created.id };
}

export async function updateMyWorkout(id, { name, note, exercises } = {}) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  if (!id || typeof id !== "string") return { error: "That workout could not be found." };

  const { data: owned } = await supabase
    .from("my_workouts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "That workout could not be found." };

  const rows = cleanExercises(exercises);
  if (rows.length === 0) return { error: "Add at least one exercise." };

  const { error } = await supabase
    .from("my_workouts")
    .update({ name: cleanName(name) || "My workout", note: cleanNote(note), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  const exError = await writeExercises(supabase, id, rows);
  if (exError) return { error: exError.message };

  revalidatePath("/splits");
  revalidatePath(`/workouts/mine/${id}`);
  return { ok: true, id };
}

export async function duplicateMyWorkout(id) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const { data: src } = await supabase
    .from("my_workouts")
    .select("name, note, exercises:my_workout_exercises(position, sets, reps, exercise_id)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!src) return { error: "That workout could not be found." };

  const { data: created, error } = await supabase
    .from("my_workouts")
    .insert({ user_id: user.id, name: `${src.name} (copy)`.slice(0, 80), note: src.note ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const rows = (src.exercises ?? [])
    .sort((a, b) => a.position - b.position)
    .map((e, i) => ({ position: i, exercise_id: e.exercise_id, sets: e.sets ?? 3, reps: e.reps ?? null }));
  const exError = await writeExercises(supabase, created.id, rows);
  if (exError) {
    await supabase.from("my_workouts").delete().eq("id", created.id);
    return { error: exError.message };
  }

  revalidatePath("/splits");
  return { ok: true, id: created.id };
}

export async function deleteMyWorkout(id) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  if (!id || typeof id !== "string") return { error: "That workout could not be found." };

  const { error } = await supabase
    .from("my_workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/splits");
  return { ok: true };
}

function cleanNote(v) {
  const s = String(v || "").trim().slice(0, 400);
  return s || null;
}
