"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProgressData } from "@/lib/data/progress";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getSessionPRs } from "@/lib/data/prs";

// Save a logged workout: one workout_sessions row plus its workout_sets.
// The session is re-authorised here rather than trusting the client.
//
// Returns a plain result instead of redirecting, so both the normal save
// path and the offline-queue replay (components/OfflineQueueSync.js) can
// call this the same way. WorkoutLogger navigates to /dashboard itself
// on success; a background replay does not navigate anywhere.
export async function saveWorkout(payload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again to save this workout." };

  const title = String(payload.title || "").trim() || "Workout";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(payload.date)
    ? payload.date
    : new Date().toISOString().slice(0, 10);
  const durationMin = Math.max(0, Math.min(600, Number(payload.durationMin) || 0));
  // Keep the day the user picked, but stamp a real time of day when the
  // workout is for today (the normal case). Backdated sessions have no
  // reliable clock time, so they stay at noon and the UI shows date only.
  const today = new Date().toISOString().slice(0, 10);
  const endedMs = Number(payload.endedAtMs);
  const completedAt =
    date === today && Number.isFinite(endedMs) && endedMs > 0
      ? new Date(endedMs)
      : new Date(`${date}T12:00:00`);
  const startedAt = new Date(completedAt.getTime() - durationMin * 60000);

  const exercises = Array.isArray(payload.exercises) ? payload.exercises : [];
  const setRows = [];
  let position = 0;
  for (const ex of exercises) {
    if (!ex?.exerciseId) continue;
    const sets = Array.isArray(ex.sets) ? ex.sets : [];
    let n = 0;
    for (const s of sets) {
      const reps = s.reps === "" || s.reps == null ? null : Math.round(Number(s.reps));
      const weight = s.weight === "" || s.weight == null ? null : Number(s.weight);
      const rirRaw = s.rir === "" || s.rir == null ? null : Math.round(Number(s.rir));
      const rir = Number.isFinite(rirRaw) ? Math.max(0, Math.min(10, rirRaw)) : null;
      if (reps == null && weight == null && !s.completed) continue;
      n += 1;
      setRows.push({
        exercise_id: ex.exerciseId,
        set_number: n,
        position: position++,
        reps: Number.isFinite(reps) ? reps : null,
        weight: Number.isFinite(weight) ? weight : null,
        rir,
        completed: s.completed !== false,
        note: n === 1 && ex.note ? String(ex.note).trim() || null : null,
      });
    }
  }

  if (setRows.length === 0) {
    return { error: "Log at least one set before saving." };
  }

  // A foreign key alone would not stop a tampered payload from pointing
  // at someone else's mesocycle (RLS on workout_sessions does not know
  // to check ownership of a referenced row in a different table), so
  // confirm it is actually this user's before attaching it.
  let userMesocycleId = null;
  if (payload.userMesocycleId) {
    const { data: owned } = await supabase
      .from("user_mesocycles")
      .select("id")
      .eq("id", payload.userMesocycleId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (owned) userMesocycleId = owned.id;
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      title,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      notes: String(payload.notes || "").trim() || null,
      split_id: payload.splitId || null,
      day_template_id: payload.dayTemplateId || null,
      variant: payload.variant || null,
      user_mesocycle_id: userMesocycleId,
    })
    .select("id")
    .single();
  if (sessionError) return { error: sessionError.message };

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(setRows.map((r) => ({ ...r, session_id: session.id })));
  if (setsError) {
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    return { error: setsError.message };
  }

  // Dashboard, Progress and the mesocycle card all read workout data, so
  // clear their cache for the next navigation.
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { ok: true, sessionId: session.id };
}

// For the post-save "Workout Completed" screen: recent volume for the
// mini trend chart, and fresh mesocycle progress if this session was
// part of one (the just-saved session already counts, since save
// happens before this is called).
export async function getPostSaveSummary(sessionId, userMesocycleId) {
  const [progress, meso, prs] = await Promise.all([
    getProgressData(),
    userMesocycleId ? getActiveMesocycle() : Promise.resolve(null),
    sessionId ? getSessionPRs(sessionId) : Promise.resolve([]),
  ]);
  return {
    recentVolumes: progress.sessionVolumes.slice(-8),
    meso: meso && meso.id === userMesocycleId ? meso : null,
    newPRs: prs,
  };
}

// The coarse 1 to 5 "how hard was this" rating, set from the summary
// screen after the session already exists.
export async function rateWorkout(sessionId, perceivedEffort) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const effort = Math.round(Number(perceivedEffort));
  if (!Number.isFinite(effort) || effort < 1 || effort > 5) {
    return { error: "Invalid rating." };
  }

  const { error } = await supabase
    .from("workout_sessions")
    .update({ perceived_effort: effort })
    .eq("id", sessionId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  return { ok: true };
}
