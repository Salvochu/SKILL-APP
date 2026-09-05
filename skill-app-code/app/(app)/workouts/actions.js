"use server";

import { createClient } from "@/lib/supabase/server";

// Delete one logged workout. RLS already scopes workout_sessions to the
// owner, and the user_id filter here makes that explicit. workout_sets
// go with it via "on delete cascade".
export async function deleteWorkout(sessionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  if (!sessionId || typeof sessionId !== "string") {
    return { error: "That workout could not be found." };
  }

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  return { ok: true };
}

// Wipe every workout the signed-in user has logged. Irreversible; the
// confirm step lives in the UI (components/dashboard/WorkoutHistoryModal).
// Mesocycle runs are left alone: their progress just recomputes from
// zero logged sessions.
export async function deleteAllWorkouts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  return { ok: true };
}
