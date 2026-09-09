"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { getMesocycleOverview } from "@/lib/data/mesocycles";
import { getChallengeAccess } from "@/lib/data/challenge";
import { VARIANT_ORDER } from "@/lib/exercises";

// The mesocycle state is read on the dashboard and the log screen; after
// any change to a run, both need fresh data on the next visit.
function revalidateMesocycle() {
  revalidatePath("/dashboard");
  revalidatePath("/log");
}

// Thin read wrapper: MesocyclePanel is a Client Component and cannot
// import a server-only data module directly, so it calls this instead.
export async function loadMesocycleOverview(templateId) {
  return getMesocycleOverview(templateId);
}

// Starts a new run of a mesocycle template. Only one active run at a
// time: abandons any other active one first, rather than blocking with
// an error, since switching programs is a normal thing to want to do.
export async function startMesocycle(templateId, variant, sessionsPerWeek) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  // The 14-Day Challenge is started by the sign-up webhook only, once
  // per account. It is never a program you pick or restart from the app.
  if (templateId === "main-character-14") {
    return { error: "The 14-Day Challenge can't be started from here." };
  }
  // Challenge accounts run the challenge and nothing else. Starting any
  // other program unlocks with a membership (whether the 14 days are
  // still going or already lapsed).
  if ((await getChallengeAccess()).isChallenge) {
    return {
      locked: true,
      error: "The training library unlocks when you continue with a membership.",
    };
  }

  const safeVariant = VARIANT_ORDER.includes(variant) ? variant : "Standard";
  const spw = Number(sessionsPerWeek);
  const safeSpw = Number.isInteger(spw) && spw >= 1 && spw <= 14 ? spw : null;

  const { error: abandonError } = await supabase
    .from("user_mesocycles")
    .update({ status: "abandoned" })
    .eq("user_id", user.id)
    .eq("status", "active");
  if (abandonError) return { error: abandonError.message };

  const { error } = await supabase.from("user_mesocycles").insert({
    user_id: user.id,
    template_id: templateId,
    start_date: new Date().toISOString().slice(0, 10),
    status: "active",
    variant: safeVariant,
    sessions_per_week: safeSpw,
  });
  if (error) return { error: error.message };

  revalidateMesocycle();
  return { ok: true };
}

export async function finishMesocycle(userMesocycleId) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("user_mesocycles")
    .update({ status: "completed" })
    .eq("id", userMesocycleId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidateMesocycle();
  return { ok: true };
}

// Challenge onboarding: point the active 14-day run at the equipment the
// user picked, drop them into the simple app, and mark onboarding done.
// If the sign-up webhook somehow did not start a run, start one now.
export async function saveChallengeSetup({ equipment, name } = {}) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const variant = equipment === "Dumbbells" ? "Dumbbells" : "Full Gym";

  const { data: run } = await supabase
    .from("user_mesocycles")
    .select("id, template:mesocycle_templates(kind)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let mesoId = null;
  if (run && run.template?.kind === "challenge") {
    mesoId = run.id;
    const { error } = await supabase
      .from("user_mesocycles")
      .update({ variant })
      .eq("id", run.id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else if (!run) {
    const { data: created, error } = await supabase
      .from("user_mesocycles")
      .insert({
        user_id: user.id,
        template_id: "main-character-14",
        start_date: new Date().toISOString().slice(0, 10),
        status: "active",
        variant,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    mesoId = created.id;
  }

  const patch = {
    user_id: user.id,
    advanced_tracking: false,
    experience_level: "Beginner",
    onboarding_completed: true,
  };
  const cleanName = String(name || "").trim().slice(0, 80);
  if (cleanName) patch.full_name = cleanName;
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(patch, { onConflict: "user_id" });
  if (profileError) return { error: profileError.message };

  revalidatePath("/", "layout");
  revalidateMesocycle();
  return { ok: true, mesoId, variant };
}

export async function abandonMesocycle(userMesocycleId) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("user_mesocycles")
    .update({ status: "abandoned" })
    .eq("id", userMesocycleId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidateMesocycle();
  return { ok: true };
}
