import "server-only";
import { cache } from "react";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeWeekStreak, weekKeyOf } from "@/lib/training";
import { currentWeek } from "@/lib/mesocycle";
import { isChallengeDayComplete } from "@/lib/data/challenge";
import { muscleShareLabel } from "@/lib/exercises";
import {
  patternForExercise,
  epley1RM,
  setLoad,
  computeStrengthScore,
  MOVEMENT_PATTERNS,
} from "@/lib/strength";

const DAY = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

// Is the signed-in user a coach? Read through the user's own session
// (not the admin client), so this can never be spoofed. Cached per
// request - several coach screens check it.
export const getIsCoach = cache(async () => {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "coach";
});

// Pull everything the coach screens read, once. RLS is bypassed here, so
// every caller MUST have passed getIsCoach() first.
async function loadEveryone() {
  const admin = createAdminClient();

  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [profilesRes, sessionsRes, setsRes, bodyRes, mesosRes, templatesRes] = await Promise.all([
    admin.from("profiles").select("user_id, full_name, fitness_goal, experience_level, phone, unit_preference, role, membership"),
    admin.from("workout_sessions").select("id, user_id, title, started_at, completed_at, perceived_effort, user_mesocycle_id"),
    admin
      .from("workout_sets")
      .select("session_id, exercise_id, weight, reps, completed, is_warmup, exercise:exercises(name)"),
    admin.from("body_logs").select("user_id, weight, body_fat, waist_cm, logged_at").order("logged_at", { ascending: true }),
    admin.from("user_mesocycles").select("user_id, template_id, start_date, status, sessions_per_week"),
    admin.from("mesocycle_templates").select("id, name, weeks"),
  ]);
  for (const r of [profilesRes, sessionsRes, setsRes, bodyRes, mesosRes, templatesRes]) {
    if (r.error) throw new Error(`Failed to load coach data: ${r.error.message}`);
  }

  const profileByUser = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
  const templateById = new Map((templatesRes.data ?? []).map((t) => [t.id, t]));
  const sessionById = new Map((sessionsRes.data ?? []).map((s) => [s.id, s]));

  // Attach each set to its session's user, drop warm-ups / incompletes.
  const setsByUser = new Map();
  for (const s of setsRes.data ?? []) {
    if (s.completed === false || s.is_warmup) continue;
    const sess = sessionById.get(s.session_id);
    if (!sess) continue;
    const w = Number(s.weight);
    const reps = Number(s.reps);
    if (!(w > 0 && reps > 0)) continue;
    if (!setsByUser.has(sess.user_id)) setsByUser.set(sess.user_id, []);
    setsByUser.get(sess.user_id).push({ ...s, started_at: sess.started_at, weight: w, reps });
  }

  const sessionsByUser = new Map();
  for (const s of sessionsRes.data ?? []) {
    if (!sessionsByUser.has(s.user_id)) sessionsByUser.set(s.user_id, []);
    sessionsByUser.get(s.user_id).push(s);
  }
  const bodyByUser = new Map();
  for (const b of bodyRes.data ?? []) {
    if (b.weight == null) continue;
    if (!bodyByUser.has(b.user_id)) bodyByUser.set(b.user_id, []);
    bodyByUser.get(b.user_id).push(b);
  }
  const mesoByUser = new Map();
  for (const m of mesosRes.data ?? []) {
    if (!mesoByUser.has(m.user_id)) mesoByUser.set(m.user_id, []);
    mesoByUser.get(m.user_id).push(m);
  }

  return { users, profileByUser, templateById, sessionsByUser, setsByUser, bodyByUser, mesoByUser };
}

// Best estimated 1RM per movement pattern from a set list within a window.
function patternBestsIn(sets, sinceMs, untilMs, bodyweightKg) {
  const bests = {};
  for (const s of sets) {
    const t = new Date(s.started_at).getTime();
    if (t < sinceMs || t >= untilMs) continue;
    const name = s.exercise?.name;
    const key = patternForExercise(name);
    if (!key) continue;
    const e1 = epley1RM(setLoad(name, s.weight, bodyweightKg), s.reps);
    if (!(e1 > 0)) continue;
    if (!bests[key] || e1 > bests[key].e1rm) bests[key] = { lift: name, e1rm: e1 };
  }
  return bests;
}

function activeMeso(mesos, templateById) {
  const run = (mesos ?? []).find((m) => m.status === "active");
  if (!run) return null;
  const t = templateById.get(run.template_id);
  if (!t) return null;
  return {
    name: t.name,
    week: currentWeek(run.start_date, t.weeks),
    weeks: t.weeks,
    sessionsPerWeek: run.sessions_per_week || 0,
    startDate: run.start_date,
  };
}

function summarize(userId, ctx, now = Date.now()) {
  const { profileByUser, templateById, sessionsByUser, setsByUser, bodyByUser, mesoByUser } = ctx;
  const profile = profileByUser.get(userId) ?? {};
  const sessions = (sessionsByUser.get(userId) ?? []).slice().sort((a, b) => a.started_at.localeCompare(b.started_at));
  const sets = setsByUser.get(userId) ?? [];
  const body = bodyByUser.get(userId) ?? [];

  const startedAts = sessions.map((s) => s.started_at);
  const lastWorkoutAt = startedAts.length ? startedAts[startedAts.length - 1] : null;
  const thisWeek = weekKeyOf(new Date(now));
  const sessionsThisWeek = sessions.filter((s) => weekKeyOf(s.started_at) === thisWeek).length;
  const streak = computeWeekStreak(startedAts, new Date(now)).current;

  const count = (a, b) => sessions.filter((s) => {
    const t = new Date(s.started_at).getTime();
    return t >= a && t < b;
  }).length;
  const sessions4w = count(now - 28 * DAY, now);
  const sessionsPrev4w = count(now - 56 * DAY, now - 28 * DAY);

  const bodyweightKg = Number(body[body.length - 1]?.weight) || 0;
  const scoreNow = computeStrengthScore(patternBestsIn(sets, now - 42 * DAY, now, bodyweightKg), bodyweightKg);
  const scorePrev = computeStrengthScore(
    patternBestsIn(sets, now - 84 * DAY, now - 42 * DAY, bodyweightKg),
    bodyweightKg,
  );
  const strengthDelta = scoreNow.covered > 0 && scorePrev.covered > 0 ? scoreNow.score - scorePrev.score : null;
  const strengthDir = strengthDelta == null ? "none" : strengthDelta > 2 ? "up" : strengthDelta < -2 ? "down" : "flat";

  // Body weight: latest vs the reading closest to 30 days ago.
  let weightDelta = null;
  if (body.length >= 2) {
    const target = now - 30 * DAY;
    const past = body.reduce((best, b) => {
      const bt = new Date(b.logged_at).getTime();
      return Math.abs(bt - target) < Math.abs(new Date(best.logged_at).getTime() - target) ? b : best;
    }, body[0]);
    weightDelta = Math.round((Number(body[body.length - 1].weight) - Number(past.weight)) * 10) / 10;
  }

  const meso = activeMeso(mesoByUser.get(userId), templateById);
  const joinedAt = ctx.userMeta?.get(userId)?.createdAt ?? null;
  const email = ctx.userMeta?.get(userId)?.email ?? null;

  const daysSinceWorkout = lastWorkoutAt ? Math.floor((now - new Date(lastWorkoutAt).getTime()) / DAY) : null;
  const joinedDaysAgo = joinedAt ? Math.floor((now - new Date(joinedAt).getTime()) / DAY) : null;

  // Sales signals, most useful first.
  const flags = [];
  if (sessions4w >= 6 && (strengthDir === "flat" || strengthDir === "down")) {
    flags.push({ key: "grinding", label: "Training hard, strength flat", tone: "accent" });
  }
  if (streak >= 3 && strengthDir === "up") {
    flags.push({ key: "winning", label: "Consistent and progressing", tone: "good" });
  }
  if (sessionsPrev4w >= 4 && sessions4w <= 1) {
    flags.push({ key: "slipping", label: "Was training, dropped off", tone: "danger" });
  }
  if (joinedDaysAgo != null && joinedDaysAgo <= 14) {
    flags.push({ key: "new", label: "New this month", tone: "sky" });
  }

  return {
    id: userId,
    name: (profile.full_name || "").trim() || (email ? email.split("@")[0] : "Unnamed"),
    email,
    phone: profile.phone || "",
    goal: profile.fitness_goal || "",
    experience: profile.experience_level || "",
    unit: profile.unit_preference === "lb" ? "lb" : "kg",
    role: profile.role || "client",
    membership: profile.membership ?? null,
    joinedAt,
    joinedDaysAgo,
    lastWorkoutAt,
    daysSinceWorkout,
    workoutsTotal: sessions.length,
    sessionsThisWeek,
    streak,
    sessions4w,
    sessionsPrev4w,
    strengthScore: scoreNow.covered > 0 ? Math.round(scoreNow.score) : null,
    strengthDelta,
    strengthDir,
    strengthPatterns: scoreNow.patterns,
    weightNow: body.length ? Math.round(Number(body[body.length - 1].weight) * 10) / 10 : null,
    weightDelta,
    bodyCount: body.length,
    activeProgram: meso,
    flags,
  };
}

// The client list for the coach overview. Returns null for non-coaches.
export async function getClients() {
  if (!(await getIsCoach())) return null;
  const ctx = await loadEveryone();
  ctx.userMeta = new Map(
    ctx.users.map((u) => [u.id, { email: u.email ?? null, createdAt: u.created_at ?? null }]),
  );

  const now = Date.now();
  const clients = ctx.users
    .map((u) => summarize(u.id, ctx, now))
    .filter((c) => c.role !== "coach")
    .sort((a, b) => {
      // Flagged first, then most recently active.
      if ((b.flags.length > 0) !== (a.flags.length > 0)) return b.flags.length - a.flags.length;
      return (b.lastWorkoutAt || "").localeCompare(a.lastWorkoutAt || "");
    });

  return {
    clients,
    totals: {
      count: clients.length,
      activeThisWeek: clients.filter((c) => c.sessionsThisWeek > 0).length,
      flagged: clients.filter((c) => c.flags.length > 0).length,
    },
  };
}

// One client, in depth, for the detail screen. Returns null if the
// caller is not a coach or the id is not a client.
export async function getClientDetail(clientId) {
  if (!(await getIsCoach())) return null;
  const ctx = await loadEveryone();
  ctx.userMeta = new Map(
    ctx.users.map((u) => [u.id, { email: u.email ?? null, createdAt: u.created_at ?? null }]),
  );
  const user = ctx.users.find((u) => u.id === clientId);
  if (!user) return null;

  const now = Date.now();
  const summary = summarize(clientId, ctx, now);
  if (summary.role === "coach") return null;

  const sessions = (ctx.sessionsByUser.get(clientId) ?? [])
    .slice()
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const setCountBySession = new Map();
  for (const s of ctx.setsByUser.get(clientId) ?? []) {
    setCountBySession.set(s.session_id, (setCountBySession.get(s.session_id) ?? 0) + 1);
  }

  const recentWorkouts = sessions.slice(0, 12).map((s) => ({
    id: s.id,
    title: s.title || "Workout",
    date: s.started_at,
    minutes:
      s.completed_at && s.started_at
        ? Math.max(0, Math.round((new Date(s.completed_at) - new Date(s.started_at)) / 60000))
        : null,
    sets: setCountBySession.get(s.id) ?? 0,
    effort: s.perceived_effort ?? null,
  }));

  const weightSeries = (ctx.bodyByUser.get(clientId) ?? [])
    .map((b) => ({
      date: dayKey(b.logged_at),
      weight: Math.round(Number(b.weight) * 10) / 10,
      bodyFat: b.body_fat == null ? null : Number(b.body_fat),
    }))
    .slice(-16);

  // Weeks trained over the last 8 ISO weeks.
  const startedAts = (ctx.sessionsByUser.get(clientId) ?? []).map((s) => s.started_at);
  const weeksWithSession = new Set(startedAts.map(weekKeyOf));
  const consistency = [];
  const monday = weekKeyOf(new Date(now));
  for (let i = 7; i >= 0; i--) {
    const wk = dayKey(new Date(new Date(`${monday}T00:00:00Z`).getTime() - i * 7 * DAY));
    consistency.push({ week: wk, trained: weeksWithSession.has(wk) });
  }

  return {
    ...summary,
    patternLabels: MOVEMENT_PATTERNS.map((p) => ({ key: p.key, label: p.label })),
    recentWorkouts,
    weightSeries,
    consistency,
  };
}

// One client's 14-Day Challenge, from the coach's side: read-only, the
// same numbers the client sees on their own Challenge tab. Returns null
// if the caller is not a coach; { started: false } if the client never
// began the challenge.
export async function getClientChallenge(clientId) {
  if (!(await getIsCoach())) return null;
  const admin = createAdminClient();
  const DAY_MS = 86400000;
  const CHALLENGE_DAYS = 14;
  const TARGET_SESSIONS = 6;

  const { data: prof } = await admin
    .from("profiles")
    .select("full_name, membership")
    .eq("user_id", clientId)
    .maybeSingle();
  const name = (prof?.full_name || "").trim();

  const { data: run } = await admin
    .from("user_mesocycles")
    .select("id, start_date, started_at, status")
    .eq("user_id", clientId)
    .eq("template_id", "main-character-14")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) return { name, membership: prof?.membership ?? null, started: false };
  // Bought but still in the prep window: no clock, no checklist yet.
  if (!run.started_at) {
    return { name, membership: prof?.membership ?? null, started: false, prep: true };
  }

  const startMs = Date.parse(`${(run.started_at || run.start_date)}T00:00:00Z`);
  const todayMs = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const challengeDay = Math.max(1, Math.floor((todayMs - startMs) / DAY_MS) + 1);

  const { data: checks } = await admin
    .from("challenge_checklist")
    .select("day, items")
    .eq("user_id", clientId);
  const byDay = {};
  for (const r of checks ?? []) byDay[r.day] = r.items ?? {};
  const completeDays = [];
  for (let d = 1; d <= CHALLENGE_DAYS; d++) {
    if (isChallengeDayComplete(byDay[d])) completeDays.push(d);
  }
  const dayNow = Math.min(challengeDay, CHALLENGE_DAYS);
  let streak = 0;
  for (let d = dayNow; d >= 1; d--) {
    if (completeDays.includes(d)) streak++;
    else if (d < dayNow) break;
  }

  const { data: sess } = await admin
    .from("workout_sessions")
    .select("id")
    .eq("user_id", clientId)
    .eq("user_mesocycle_id", run.id);
  const sessionIds = (sess ?? []).map((s) => s.id);

  let volumeKg = 0;
  const muscleTally = {};
  if (sessionIds.length) {
    const { data: sets } = await admin
      .from("workout_sets")
      .select(
        "weight, reps, completed, is_warmup, exercise:exercises(exercise_muscles(role, muscle:muscles(name, parent)))",
      )
      .in("session_id", sessionIds);
    for (const s of sets ?? []) {
      if (s.completed === false || s.is_warmup) continue;
      volumeKg += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      for (const t of s.exercise?.exercise_muscles ?? []) {
        const p = t.muscle?.parent;
        if (!p) continue;
        const label = muscleShareLabel(t.muscle?.name, p);
        muscleTally[label] = (muscleTally[label] ?? 0) + (t.role === "primary" ? 1 : 0.5);
      }
    }
  }
  const topMuscles = Object.entries(muscleTally)
    .map(([group, sets]) => ({ group, sets: Math.round(sets) }))
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 3);

  return {
    name,
    membership: prof?.membership ?? null,
    started: true,
    status: run.status,
    challengeDay,
    challengeDays: CHALLENGE_DAYS,
    completeDays,
    byDay,
    streak,
    sessions: sessionIds.length,
    targetSessions: TARGET_SESSIONS,
    perfectDays: completeDays.length,
    volumeKg: Math.round(volumeKg),
    complete: run.status === "completed" || sessionIds.length >= TARGET_SESSIONS,
    topMuscles,
  };
}
