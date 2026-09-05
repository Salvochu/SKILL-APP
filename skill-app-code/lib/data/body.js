import "server-only";
import { createClient } from "@/lib/supabase/server";

const FIELDS = ["weight", "waist_cm", "chest_cm", "arm_cm", "thigh_cm", "hip_cm"];

// The signed-in user's body check-ins (weight and optional tape
// measurements), oldest first. RLS scopes body_logs to auth.uid().
export async function getBodyLog() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_logs")
    .select("logged_at, weight, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm, note")
    .order("logged_at", { ascending: true });
  if (error) throw new Error(`Failed to load body log: ${error.message}`);

  const entries = (data ?? []).map((r) => ({
    date: r.logged_at,
    weight: r.weight == null ? null : Number(r.weight),
    waist: r.waist_cm == null ? null : Number(r.waist_cm),
    chest: r.chest_cm == null ? null : Number(r.chest_cm),
    arm: r.arm_cm == null ? null : Number(r.arm_cm),
    thigh: r.thigh_cm == null ? null : Number(r.thigh_cm),
    hip: r.hip_cm == null ? null : Number(r.hip_cm),
    note: r.note ?? null,
  }));

  const latest = entries.length ? entries[entries.length - 1] : null;
  // Change over roughly the last month, for the headline number.
  const monthAgo = entries.filter((e) => e.weight != null).slice(-8)[0] ?? null;
  const weightChange =
    latest?.weight != null && monthAgo?.weight != null && monthAgo !== latest
      ? Math.round((latest.weight - monthAgo.weight) * 10) / 10
      : null;

  return { entries, latest, weightChange, hasAny: entries.length > 0 };
}

export { FIELDS as BODY_FIELDS };
