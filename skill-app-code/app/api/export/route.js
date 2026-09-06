import { createClient } from "@/lib/supabase/server";

// GET /api/export : the signed-in user's full training log as a CSV,
// one row per logged set. proxy.js lets /api/ through without the auth
// redirect, so the auth check is done here.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Sign in to export your data.", { status: 401 });
  }

  const [sessionsRes, setsRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, started_at, completed_at, notes, perceived_effort")
      .order("started_at", { ascending: true }),
    supabase
      .from("workout_sets")
      .select(
        "session_id, set_number, reps, weight, rir, completed, is_warmup, exercise:exercises(name, muscle, exercise_muscles(role, muscle:muscles(name, position)))",
      ),
  ]);
  if (sessionsRes.error || setsRes.error) {
    return new Response("Could not build the export. Try again.", { status: 500 });
  }

  const sessions = new Map((sessionsRes.data ?? []).map((s) => [s.id, s]));
  const bySession = new Map();
  for (const set of setsRes.data ?? []) {
    if (!bySession.has(set.session_id)) bySession.set(set.session_id, []);
    bySession.get(set.session_id).push(set);
  }

  const header = [
    "Date",
    "Time",
    "Workout",
    "Duration (min)",
    "Effort (1-5)",
    "Exercise",
    "Muscle group",
    "Primary muscles",
    "Assisting muscles",
    "Set",
    "Warm-up",
    "Weight (kg)",
    "Reps",
    "RIR",
    "Completed",
    "Session notes",
  ];
  const lines = [header.map(csv).join(",")];

  for (const s of sessionsRes.data ?? []) {
    const start = new Date(s.started_at);
    const durationMin =
      s.completed_at != null
        ? Math.max(0, Math.round((new Date(s.completed_at) - start) / 60000))
        : "";
    const sets = (bySession.get(s.id) ?? []).sort(
      (a, b) => (a.set_number ?? 0) - (b.set_number ?? 0),
    );
    const rows = sets.length ? sets : [null];
    for (const set of rows) {
      lines.push(
        [
          start.toISOString().slice(0, 10),
          start.toISOString().slice(11, 16),
          s.title,
          durationMin,
          s.perceived_effort ?? "",
          set?.exercise?.name ?? "",
          set?.exercise?.muscle ?? "",
          muscleNames(set, "primary"),
          muscleNames(set, "secondary"),
          set?.set_number ?? "",
          set == null ? "" : set.is_warmup ? "yes" : "no",
          set?.weight ?? "",
          set?.reps ?? "",
          set?.rir ?? "",
          set == null ? "" : set.completed === false ? "no" : "yes",
          s.notes ?? "",
        ]
          .map(csv)
          .join(","),
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="skill-training-log-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function muscleNames(set, role) {
  const tags = set?.exercise?.exercise_muscles ?? [];
  return tags
    .filter((t) => t.role === role && t.muscle)
    .sort((a, b) => (a.muscle.position ?? 0) - (b.muscle.position ?? 0))
    .map((t) => t.muscle.name)
    .join(", ");
}

function csv(value) {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
