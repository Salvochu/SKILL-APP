"use server";

import { createClient } from "@/lib/supabase/server";

// Starts a new run of a mesocycle template. Only one active run at a
// time: abandons any other active one first, rather than blocking with
// an error, since switching programs is a normal thing to want to do.
export async function startMesocycle(templateId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

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
  });
  if (error) return { error: error.message };

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

  return { ok: true };
}
