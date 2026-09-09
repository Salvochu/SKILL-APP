import "server-only";
import { cache } from "react";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { getMembership } from "@/lib/data/profile";
import { CHECKLIST_KEYS } from "@/lib/challenge/curriculum";
import { getMuscleMapForSessions } from "@/lib/data/volume";

const CHALLENGE_TEMPLATE_ID = "main-character-14";
// Sessions in the 14-day plan (6 lifts + cardio ticks); "done" at 6.
const CHALLENGE_TARGET_SESSIONS = 6;

const DAY_MS = 86400000;
const CHALLENGE_DAYS = 14;
// Days past the 14 before training locks. The dashboard fork shows from
// day 14; the hard lock is a few days later.
const GRACE_DAYS = 3;

// For a free-challenge account: how far through (or past) the 14 days
// they are, and whether logging new workouts is now locked. Members and
// the coach are never locked.
export const getChallengeAccess = cache(async () => {
  const membership = await getMembership();
  if (membership !== "challenge") {
    return { isChallenge: false, lapsed: false, challengeDay: null, challengeDays: CHALLENGE_DAYS };
  }

  const user = await getSessionUser();
  const supabase = await getServerSupabase();

  const { data: run } = await supabase
    .from("user_mesocycles")
    .select("start_date, template:mesocycle_templates(kind)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Count from the challenge run's start date; fall back to the account
  // age if the run is missing (webhook miss that onboarding never fixed).
  const startMs =
    run?.template?.kind === "challenge" && run.start_date
      ? Date.parse(`${run.start_date}T00:00:00Z`)
      : user?.created_at
        ? Date.parse(user.created_at)
        : Date.now();
  const todayMs = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const daysSince = Math.max(0, Math.floor((todayMs - startMs) / DAY_MS));
  const challengeDay = daysSince + 1;

  return {
    isChallenge: true,
    challengeDay,
    challengeDays: CHALLENGE_DAYS,
    lapsed: challengeDay > CHALLENGE_DAYS + GRACE_DAYS,
  };
});

function isMissingChecklistTable(error) {
  return (
    error?.code === "42P01" ||
    /relation .*challenge_checklist.* does not exist/i.test(error?.message ?? "")
  );
}

// A day is done when every checklist item that applies to it is ticked.
// All five apply every day (the "session" item just relabels on rest
// days), so this is a plain "all keys true" check.
export function isChallengeDayComplete(items) {
  if (!items) return false;
  return CHECKLIST_KEYS.every((k) => items[k] === true);
}

// The user's saved checklist state, as { [day]: { session, meal, ... } }
// plus a derived list of completed day numbers and the current streak
// (consecutive complete days ending at yesterday or today). Degrades to
// empty if the table has not been migrated yet.
export const getChallengeChecklist = cache(async () => {
  const empty = { byDay: {}, completeDays: [], streak: 0 };
  const membership = await getMembership();
  if (membership !== "challenge") return empty;

  const user = await getSessionUser();
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("challenge_checklist")
    .select("day, items")
    .eq("user_id", user.id);
  if (error) {
    if (isMissingChecklistTable(error)) return empty;
    throw new Error(`Failed to load challenge checklist: ${error.message}`);
  }

  const byDay = {};
  for (const row of data ?? []) byDay[row.day] = row.items ?? {};

  const completeDays = [];
  for (let d = 1; d <= CHALLENGE_DAYS; d++) {
    if (isChallengeDayComplete(byDay[d])) completeDays.push(d);
  }

  const { challengeDay } = await getChallengeAccess();
  let streak = 0;
  for (let d = Math.min(challengeDay, CHALLENGE_DAYS); d >= 1; d--) {
    if (completeDays.includes(d)) streak++;
    else if (d < challengeDay) break;
  }

  return { byDay, completeDays, streak };
});

// Everything the "challenge complete" badge and its share card need:
// whether the 14-day plan is finished, and the numbers to show for it.
// `completed` is true once they have logged the target number of
// sessions on the challenge run (or the run is marked completed).
export const getChallengeCompletion = cache(async () => {
  const none = {
    started: false,
    completed: false,
    sessions: 0,
    targetSessions: CHALLENGE_TARGET_SESSIONS,
    perfectDays: 0,
    volumeKg: 0,
    muscles: { intensity: {}, top: [] },
  };

  const user = await getSessionUser();
  if (!user) return none;
  const supabase = await getServerSupabase();

  const { data: run } = await supabase
    .from("user_mesocycles")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("template_id", CHALLENGE_TEMPLATE_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) return none;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("user_mesocycle_id", run.id);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  let volumeKg = 0;
  if (sessionIds.length) {
    const { data: sets } = await supabase
      .from("workout_sets")
      .select("weight, reps, completed, is_warmup")
      .in("session_id", sessionIds);
    for (const s of sets ?? []) {
      if (s.completed === false || s.is_warmup) continue;
      volumeKg += (Number(s.weight) || 0) * (Number(s.reps) || 0);
    }
  }

  // perfect days
  let perfectDays = 0;
  const { data: checks } = await supabase
    .from("challenge_checklist")
    .select("items")
    .eq("user_id", user.id);
  for (const row of checks ?? []) {
    if (isChallengeDayComplete(row.items)) perfectDays++;
  }

  const muscles = await getMuscleMapForSessions(sessionIds);

  return {
    started: true,
    completed: run.status === "completed" || sessionIds.length >= CHALLENGE_TARGET_SESSIONS,
    sessions: sessionIds.length,
    targetSessions: CHALLENGE_TARGET_SESSIONS,
    perfectDays,
    volumeKg: Math.round(volumeKg),
    muscles,
  };
});

