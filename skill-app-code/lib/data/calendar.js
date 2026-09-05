import "server-only";
import { createClient } from "@/lib/supabase/server";

// Everything the training calendar needs: each logged session with its
// day, title and volume, plus the days that have a body check-in. Small
// payload, so the client component can page through months without
// re-fetching.
export async function getWorkoutCalendar() {
  const supabase = await createClient();

  const [sessionsRes, setsRes, bodyRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, started_at")
      .order("started_at", { ascending: true }),
    supabase.from("workout_sets").select("session_id, reps, weight, completed"),
    supabase.from("body_logs").select("logged_at"),
  ]);
  for (const r of [sessionsRes, setsRes, bodyRes]) {
    if (r.error) throw new Error(`Failed to load calendar: ${r.error.message}`);
  }

  const volume = new Map();
  for (const s of setsRes.data ?? []) {
    if (s.completed === false) continue;
    const v = (Number(s.weight) || 0) * (Number(s.reps) || 0);
    volume.set(s.session_id, (volume.get(s.session_id) || 0) + v);
  }

  const sessions = (sessionsRes.data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    date: new Date(s.started_at).toISOString().slice(0, 10),
    startedAt: s.started_at,
    volumeKg: Math.round(volume.get(s.id) || 0),
  }));

  const bodyDates = [...new Set((bodyRes.data ?? []).map((r) => r.logged_at))];

  return { sessions, bodyDates };
}
