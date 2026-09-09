"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, getSessionUser } from "@/lib/data/session";
import { getChallengeAccess } from "@/lib/data/challenge";
import { CHECKLIST_KEYS } from "@/lib/challenge/curriculum";

// Tick or untick one checklist item for one challenge day. Merges into
// the day's jsonb blob so the other items are left alone. Only the
// current or a past day can be edited; you cannot pre-tick the future.
export async function setChecklistItem(day, key, value) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const access = await getChallengeAccess();
  if (!access.isChallenge) return { error: "Not a challenge account." };

  const d = Number(day);
  if (!Number.isInteger(d) || d < 1 || d > 14) return { error: "Bad day." };
  if (d > access.challengeDay) return { error: "That day has not started yet." };
  if (!CHECKLIST_KEYS.includes(key)) return { error: "Bad item." };

  const { data: existing } = await supabase
    .from("challenge_checklist")
    .select("items")
    .eq("user_id", user.id)
    .eq("day", d)
    .maybeSingle();

  const items = { ...(existing?.items ?? {}), [key]: value === true };

  const { error } = await supabase
    .from("challenge_checklist")
    .upsert(
      { user_id: user.id, day: d, items, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" },
    );
  if (error) return { error: error.message };

  revalidatePath("/challenge");
  revalidatePath("/dashboard");
  return { ok: true, items };
}
