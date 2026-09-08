import "server-only";
import { cache } from "react";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { getMembership } from "@/lib/data/profile";

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
