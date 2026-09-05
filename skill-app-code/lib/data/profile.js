import "server-only";
import { createClient } from "@/lib/supabase/server";

// The signed-in user's profile row. Most fields are optional and the row
// itself may not exist yet (a fresh account has none), so this always
// returns a plain object with sensible defaults rather than null.
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, age, country, fitness_goal, experience_level, phone, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);

  return {
    email: user.email,
    fullName: data?.full_name ?? "",
    age: data?.age ?? "",
    country: data?.country ?? "",
    fitnessGoal: data?.fitness_goal ?? "",
    experienceLevel: data?.experience_level ?? "",
    phone: data?.phone ?? "",
    avatarUrl: data?.avatar_url ?? null,
  };
}

// Whether the onboarding quiz (components/onboarding) should show. No
// profile row at all (a brand new account) counts as needing it, same
// as an explicit false.
export async function needsOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to check onboarding: ${error.message}`);

  return !data?.onboarding_completed;
}
