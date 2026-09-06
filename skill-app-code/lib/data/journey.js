import "server-only";
import { createClient } from "@/lib/supabase/server";
import { patternForExercise } from "@/lib/strength";
import { weekKeyOf } from "@/lib/training";
import { XP, journeyProgress } from "@/lib/journey";

const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10);
const epley = (w, r) => (w > 0 && r > 0 && r <= 15 ? w * (1 + r / 30) : 0);

async function loadJourneyData(supabase) {
  const [sessionsRes, setsRes, mesoRes, bodyRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, started_at, user_mesocycle_id")
      .order("started_at", { ascending: true }),
    supabase
      .from("workout_sets")
      .select("session_id, exercise_id, reps, weight, completed, exercise:exercises(name)"),
    supabase.from("user_mesocycles").select("id, status, sessions_per_week"),
    supabase.from("body_logs").select("logged_at"),
  ]);
  for (const r of [sessionsRes, setsRes, mesoRes, bodyRes]) {
    if (r.error) throw new Error(`Failed to load journey: ${r.error.message}`);
  }
  return {
    sessions: sessionsRes.data ?? [],
    sets: setsRes.data ?? [],
    mesos: mesoRes.data ?? [],
    body: bodyRes.data ?? [],
  };
}

// Pure: total XP and its breakdown from the loaded data. `excludeSessionId`
// drops one session, so the finish screen can diff "with" against
// "without" to see exactly what the just-saved workout was worth.
function computeXp({ sessions, sets, mesos, body }, excludeSessionId = null) {
  const sessById = new Map(
    sessions.filter((s) => s.id !== excludeSessionId).map((s) => [s.id, s]),
  );

  const workoutCount = sessById.size;

  // Consistent week: hit the active program's weekly target that week, or
  // at least two sessions when no program was running.
  const mesoTarget = new Map(
    mesos.map((m) => [m.id, m.sessions_per_week > 0 ? m.sessions_per_week : 3]),
  );
  const weeks = new Map();
  for (const s of sessById.values()) {
    const wk = weekKeyOf(s.started_at);
    const b = weeks.get(wk) ?? { count: 0, target: 2 };
    b.count += 1;
    if (s.user_mesocycle_id && mesoTarget.has(s.user_mesocycle_id)) {
      b.target = Math.max(b.target, mesoTarget.get(s.user_mesocycle_id));
    }
    weeks.set(wk, b);
  }
  let consistentWeeks = 0;
  for (const b of weeks.values()) if (b.count >= b.target) consistentWeeks += 1;

  // Strength PRs: for the six pattern lifts only, a day whose best
  // estimated 1RM beats every earlier day for that lift. One per lift
  // per day.
  const dayBest = new Map(); // `${exId}|${day}` -> best e1RM
  for (const s of sets) {
    if (s.completed === false || !sessById.has(s.session_id)) continue;
    const name = s.exercise?.name ?? "";
    if (!patternForExercise(name)) continue;
    const w = Number(s.weight);
    const reps = Number(s.reps);
    if (!(w > 0 && reps > 0)) continue;
    const day = dayKey(sessById.get(s.session_id).started_at);
    const k = `${s.exercise_id}|${day}`;
    dayBest.set(k, Math.max(dayBest.get(k) ?? 0, epley(w, reps)));
  }
  const entries = [...dayBest.entries()]
    .map(([k, e1]) => {
      const i = k.indexOf("|");
      return { exId: k.slice(0, i), day: k.slice(i + 1), e1 };
    })
    .sort((a, b) => a.day.localeCompare(b.day));
  const runningBest = new Map();
  let prCount = 0;
  for (const e of entries) {
    const prev = runningBest.get(e.exId) ?? 0;
    if (e.e1 > prev + 0.01) prCount += 1;
    runningBest.set(e.exId, Math.max(prev, e.e1));
  }

  const mesoCount = mesos.filter((m) => m.status === "completed").length;

  // Body check-ins: capped at one per week.
  const bodyWeeks = new Set(body.map((b) => weekKeyOf(b.logged_at)));
  const bodyCount = bodyWeeks.size;

  const breakdown = [
    { key: "workout", label: "Workouts logged", count: workoutCount, xp: workoutCount * XP.workout },
    { key: "consistentWeek", label: "Consistent weeks", count: consistentWeeks, xp: consistentWeeks * XP.consistentWeek },
    { key: "patternPR", label: "Strength PRs", count: prCount, xp: prCount * XP.patternPR },
    { key: "mesocycle", label: "Programs finished", count: mesoCount, xp: mesoCount * XP.mesocycle },
    { key: "bodyCheckIn", label: "Body check-ins", count: bodyCount, xp: bodyCount * XP.bodyCheckIn },
  ];
  return { xp: breakdown.reduce((a, b) => a + b.xp, 0), breakdown };
}

export async function getJourney() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await loadJourneyData(supabase);
  const { xp, breakdown } = computeXp(data);
  return { ...journeyProgress(xp), breakdown };
}

// What the just-saved session was worth: XP gained, and whether it pushed
// a level-up or a new tier.
export async function getSessionJourneyDelta(sessionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !sessionId) return null;

  const data = await loadJourneyData(supabase);
  if (!data.sessions.some((s) => s.id === sessionId)) return null;

  const after = journeyProgress(computeXp(data).xp);
  const before = journeyProgress(computeXp(data, sessionId).xp);
  return {
    xpGained: Math.max(0, after.xp - before.xp),
    level: after.level,
    tier: after.tier,
    tierColor: after.tierColor,
    pctToNextLevel: after.pctToNextLevel,
    xpToNextLevel: after.xpToNextLevel,
    leveledUp: after.level > before.level,
    rankedUp: after.tier !== before.tier,
  };
}
