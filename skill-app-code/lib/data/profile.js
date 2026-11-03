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
// choice (Settings); when they have not chosen, only someone who said
// they are Advanced (and the coach) starts with it on. Beginners,
// intermediates and anyone who skipped the question start simple, and
// can turn it on in Settings whenever they want. `isBeginner` is
// separate: it drives the beginner-only extras (Foundations, the staple
// lifts in the library). `simplified` and `showStrengthCheck` are kept
// as the inverse / alias so existing callers keep working.
export const getBeginnerContext = cache(async () => {
  const user = await getSessionUser();
  if (!user) {
    return {
      isBeginner: false,
      advanced: true,
      advancedIsExplicit: false,
      showStrengthCheck: true,
      simplified: false,
    };
  }

  const data = await getProfileRow();
  const isCoach = data?.role === "coach";
  const level = data?.experience_level ?? "";
  const isBeginner = !isCoach && level === "Beginner";

  const advancedByDefault = isCoach || level === "Advanced";
  const advancedIsExplicit = typeof data?.advanced_tracking === "boolean";
  const advanced = advancedIsExplicit ? data.advanced_tracking : advancedByDefault;

  return {
    isBeginner,
    advanced,
    advancedIsExplicit,
    showStrengthCheck: advanced,
    simplified: !advanced,
  };
});

// How the account was created: a free challenge sign-up, a paying app
// member, or the coach. NULL (accounts predating the column) counts as
// a member.
export const getMembership = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const data = await getProfileRow();
  return data?.membership ?? "member";
});

// Accounts the coach invited himself (Clients > Invite): his 1:1 clients
// and testers. Free access, so no subscription to manage and no 1:1
// upsell. Older invites predate the billing flag and only carry their
// source.
export function coachInvited(appMetadata, userMetadata) {
  const billing = appMetadata?.billing;
  return billing === "coach" || (!billing && userMetadata?.source === "coach_invite");
}

// The same check from the session token, with no extra round-trip (it
// can be up to an hour behind an invite that upgraded an existing
// account, see getSessionUser).
export const getIsCoachInvited = cache(async () => {
  const user = await getSessionUser();
  return user ? coachInvited(user.appMetadata, user.userMetadata) : false;
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
