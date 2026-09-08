import "server-only";
import { cache } from "react";
import { getSessionUser, getProfileRow } from "@/lib/data/session";

// The user's kg / lb display choice. Weights are always stored in kg;
// this only changes display and input.
export const getUnitPreference = cache(async () => {
  const row = await getProfileRow();
  return row?.unit_preference === "lb" ? "lb" : "kg";
});

// The signed-in user's profile row. Most fields are optional and the row
// itself may not exist yet (a fresh account has none), so this always
// returns a plain object with sensible defaults rather than null.
export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const data = await getProfileRow();

  return {
    email: user.email,
    fullName: data?.full_name ?? "",
    age: data?.age ?? "",
    country: data?.country ?? "",
    fitnessGoal: data?.fitness_goal ?? "",
    experienceLevel: data?.experience_level ?? "",
    phone: data?.phone ?? "",
    avatarUrl: data?.avatar_url ?? null,
    unitPreference: data?.unit_preference === "lb" ? "lb" : "kg",
  };
}

// How much training detail to show: reps in reserve in the logger,
// program weeks and RIR targets, the strength benchmark, the trend
// charts. `advanced_tracking` on the profile is the user's explicit
// choice (Settings); when they have not chosen, a new beginner starts
// simple and everyone else starts full. A coach always gets the full
// app. `simplified` and `showStrengthCheck` are kept as the inverse /
// alias so existing callers keep working.
export const getBeginnerContext = cache(async () => {
  const user = await getSessionUser();
  if (!user) {
    return {
      isBeginner: false,
      daysSinceJoin: null,
      advanced: true,
      advancedIsExplicit: false,
      showStrengthCheck: true,
      simplified: false,
    };
  }

  const data = await getProfileRow();
  const isCoach = data?.role === "coach";
  const isBeginner = !isCoach && (data?.experience_level ?? "") === "Beginner";
  const daysSinceJoin = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at)) / 86400000)
    : null;

  const advancedByDefault =
    !isBeginner || (daysSinceJoin != null && daysSinceJoin >= 30);
  const advancedIsExplicit = typeof data?.advanced_tracking === "boolean";
  const advanced = isCoach
    ? true
    : advancedIsExplicit
      ? data.advanced_tracking
      : advancedByDefault;

  return {
    isBeginner,
    daysSinceJoin,
    advanced,
    advancedIsExplicit,
    showStrengthCheck: advanced,
    simplified: !advanced,
  };
});

// Whether the onboarding quiz (components/onboarding) should show. No
// profile row at all (a brand new account) counts as needing it, same
// as an explicit false.
export async function needsOnboarding() {
  const user = await getSessionUser();
  if (!user) return false;
  const data = await getProfileRow();
  return !data?.onboarding_completed;
}
