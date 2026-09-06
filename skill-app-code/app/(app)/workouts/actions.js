"use server";

import { revalidatePath } from "next/cache";
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

// Correct a past workout: fix mistyped weight / reps / RIR, flip whether
// a set counted, and adjust the name or date. Only edits rows that
// already belong to this session (no adding or removing sets here) so a
// tampered payload cannot touch anything else. Weights arrive in kg,
// already converted by the client.
export async function updateWorkoutSession(sessionId, patch) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  if (!sessionId || typeof sessionId !== "string") {
    return { error: "That workout could not be found." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, title, started_at, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (sessionError) return { error: sessionError.message };
  if (!session) return { error: "That workout could not be found." };

  // Name and date live on the session row. A date change shifts
  // started_at and completed_at by whole days, so the time of day and
  // the duration are both preserved.
  const sessionUpdate = {};
  const newTitle = String(patch?.title ?? "").trim();
  if (newTitle && newTitle !== session.title) sessionUpdate.title = newTitle;

  if (typeof patch?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) {
    const currentDay = new Date(session.started_at).toISOString().slice(0, 10);
    if (patch.date !== currentDay) {
      const shiftMs =
        Date.parse(`${patch.date}T00:00:00Z`) - Date.parse(`${currentDay}T00:00:00Z`);
      if (Number.isFinite(shiftMs) && shiftMs !== 0) {
        sessionUpdate.started_at = new Date(
          new Date(session.started_at).getTime() + shiftMs,
        ).toISOString();
        if (session.completed_at) {
          sessionUpdate.completed_at = new Date(
            new Date(session.completed_at).getTime() + shiftMs,
          ).toISOString();
        }
      }
    }
  }

  if (Object.keys(sessionUpdate).length > 0) {
    const { error } = await supabase
      .from("workout_sessions")
      .update(sessionUpdate)
      .eq("id", sessionId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  }

  const incoming = Array.isArray(patch?.sets) ? patch.sets : [];
  if (incoming.length > 0) {
    const { data: owned, error: ownedError } = await supabase
      .from("workout_sets")
      .select("id")
      .eq("session_id", sessionId);
    if (ownedError) return { error: ownedError.message };
    const allowed = new Set((owned ?? []).map((r) => r.id));

    for (const s of incoming) {
      if (!s || !allowed.has(s.id)) continue;
      const repsNum = s.reps === "" || s.reps == null ? null : Math.round(Number(s.reps));
      const weightNum = s.weight === "" || s.weight == null ? null : Number(s.weight);
      const rirNum = s.rir === "" || s.rir == null ? null : Math.round(Number(s.rir));
      const { error } = await supabase
        .from("workout_sets")
        .update({
          reps: Number.isFinite(repsNum) ? Math.max(0, repsNum) : null,
          weight: Number.isFinite(weightNum) ? Math.max(0, weightNum) : null,
          rir: Number.isFinite(rirNum) ? Math.max(0, Math.min(10, rirNum)) : null,
          completed: s.completed !== false,
          is_warmup: s.warmup === true,
        })
        .eq("id", s.id)
        .eq("session_id", sessionId);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/history");
  revalidatePath(`/workouts/${sessionId}`);
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
