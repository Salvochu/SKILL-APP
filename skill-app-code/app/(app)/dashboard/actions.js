"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMesocycleOverview } from "@/lib/data/mesocycles";
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
export async function startMesocycle(templateId, variant) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const safeVariant = VARIANT_ORDER.includes(variant) ? variant : "Standard";

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
  });
  if (error) return { error: error.message };

  revalidateMesocycle();
  return { ok: true };
}

export async function finishMesocycle(userMesocycleId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function abandonMesocycle(userMesocycleId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
