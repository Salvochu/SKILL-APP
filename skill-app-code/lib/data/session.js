import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// One Supabase server client and one auth check per request, shared by
// every DAL function.
//
// supabase.auth.getUser() is a network round-trip to the Supabase auth
// server (it verifies the JWT server-side). Before this, every DAL
// function called it itself, so a page that reads the profile, the unit
// preference, the journey and the active mesocycle paid four separate
// auth round-trips on top of the one proxy.js already does. React's
// cache() collapses them to a single call for the whole render.

export const getServerSupabase = cache(async () => createClient());

export const getSessionUser = cache(async () => {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

// The signed-in user's profile row, fetched once and shared. Selects the
// superset of columns any caller needs so getProfile / getUnitPreference
// / getBeginnerContext / needsOnboarding all read the same row.
export const getProfileRow = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, age, country, fitness_goal, experience_level, phone, avatar_url, unit_preference, role, onboarding_completed",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data ?? null;
});
