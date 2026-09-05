"use server";

import { createClient } from "@/lib/supabase/server";

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
  const startedAt = new Date(`${date}T12:00:00`);
  const completedAt = new Date(startedAt.getTime() + durationMin * 60000);

  const exercises = Array.isArray(payload.exercises) ? payload.exercises : [];
  const setRows = [];
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

  // Dashboard / Progress read workout data at request time, so the next
  // navigation already reflects this save.
  return { ok: true, sessionId: session.id };
}
