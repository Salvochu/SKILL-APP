"use server";

import { createClient } from "@/lib/supabase/server";

const num = (v, lo, hi) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < lo || n > hi) return NaN;
  return Math.round(n * 10) / 10;
};

// Upsert one body check-in for a date. One row per day per user
// (unique on user_id + logged_at), so re-logging the same day edits it.
export async function logBodyEntry(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const date = /^\d{4}-\d{2}-\d{2}$/.test(formData.get("date"))
    ? formData.get("date")
    : new Date().toISOString().slice(0, 10);

  const weight = num(formData.get("weight"), 20, 400);
  const bodyFat = num(formData.get("bodyFat"), 2, 70);
  const waist = num(formData.get("waist"), 30, 250);
  const chest = num(formData.get("chest"), 40, 250);
  const arm = num(formData.get("arm"), 15, 100);
  const thigh = num(formData.get("thigh"), 25, 150);
  const hip = num(formData.get("hip"), 40, 250);
  for (const v of [weight, bodyFat, waist, chest, arm, thigh, hip]) {
    if (Number.isNaN(v)) return { error: "One of those numbers looks off. Check and try again." };
  }
  const note = (formData.get("note") || "").toString().trim() || null;

  if (weight == null && bodyFat == null && waist == null && chest == null && arm == null && thigh == null && hip == null) {
    return { error: "Add a weight or at least one measurement." };
  }

  const { error } = await supabase.from("body_logs").upsert(
    {
      user_id: user.id,
      logged_at: date,
      weight,
      body_fat: bodyFat,
      waist_cm: waist,
      chest_cm: chest,
      arm_cm: arm,
      thigh_cm: thigh,
      hip_cm: hip,
      note,
    },
    { onConflict: "user_id,logged_at" },
  );
  if (error) return { error: error.message };

  return { ok: true };
}

export async function deleteBodyEntry(date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("body_logs")
    .delete()
    .eq("user_id", user.id)
    .eq("logged_at", date);
  if (error) return { error: error.message };

  return { ok: true };
}
