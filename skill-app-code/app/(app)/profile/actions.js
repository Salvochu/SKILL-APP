"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileToGHL } from "@/lib/ghl";

const str = (v) => (typeof v === "string" ? v.trim() : "");

// Saves the profile fields and, if one was chosen, the avatar photo.
// Both happen in the one action so the form only has a single pending
// state, rather than juggling an upload and a save separately.
export async function saveProfile(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const fullName = str(formData.get("fullName"));
  const country = str(formData.get("country"));
  const fitnessGoal = str(formData.get("fitnessGoal"));
  const experienceLevel = str(formData.get("experienceLevel"));
  const phone = str(formData.get("phone"));

  const ageRaw = str(formData.get("age"));
  const age = ageRaw ? Math.round(Number(ageRaw)) : null;
  if (age != null && (!Number.isFinite(age) || age < 13 || age > 100)) {
    return { error: "Age should be between 13 and 100." };
  }

  let avatarUrl;
  const file = formData.get("avatar");
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "That photo is too large. Please use one under 5MB." };
    }
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (uploadError) return { error: `Could not save that photo: ${uploadError.message}` };
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new photo shows immediately instead of the
    // browser's cached copy of the old one at the same path.
    avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;
  }

  // Set only when called from the onboarding quiz finishing (or being
  // exited partway through, still counts as done: see
  // components/onboarding/OnboardingQuiz.js). The plain Profile screen
  // never sends this, so saving there does not implicitly mark it.
  const completingOnboarding = formData.get("completeOnboarding") === "1";

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    full_name: fullName || null,
    age,
    country: country || null,
    fitness_goal: fitnessGoal || null,
    experience_level: experienceLevel || null,
    phone: phone || null,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    ...(completingOnboarding ? { onboarding_completed: true } : {}),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  // Best effort: never let a CRM hiccup block someone saving their own
  // profile.
  syncProfileToGHL({ email: user.email, fullName, phone, age, country, fitnessGoal, experienceLevel }).catch(
    () => {},
  );

  return { ok: true, avatarUrl };
}

// Marks onboarding done without saving any profile fields: the "Skip
// for now" path out of the quiz, or exiting before answering anything.
export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, onboarding_completed: true }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  return { ok: true };
}

// Permanently deletes the signed-in user's account: their login and,
// via "on delete cascade" on every table's user_id, all of their logged
// workouts and their profile row. Irreversible, the confirm step lives
// in the UI (components/profile/DangerZone.js).
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  try {
    await supabase.auth.signOut();
  } catch {
    // The account is already gone at this point, which is what matters;
    // clearing the local session cookie is a courtesy, not load-bearing.
  }

  return { ok: true };
}
