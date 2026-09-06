"use server";

import { createClient } from "@/lib/supabase/server";

const BOOL_KEYS = {
  quietDayNudge: "quiet_day_nudge",
  scheduledEnabled: "scheduled_enabled",
  weeklyRecap: "weekly_recap",
  streakAtRisk: "streak_at_risk",
  restTimerDone: "rest_timer_done",
  unfinishedWorkout: "unfinished_workout",
  restTimerEnabled: "rest_timer_enabled",
};

// Merge a partial set of preference changes into the user's row.
export async function saveNotificationPrefs(patch) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const row = { user_id: user.id, updated_at: new Date().toISOString() };
  for (const [key, col] of Object.entries(BOOL_KEYS)) {
    if (key in patch) row[col] = Boolean(patch[key]);
  }
  if ("scheduledDays" in patch) {
    const days = Array.isArray(patch.scheduledDays) ? patch.scheduledDays : [];
    row.scheduled_days = [...new Set(days.map(Number).filter((n) => n >= 0 && n <= 6))].sort();
  }

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(row, { onConflict: "user_id" });
  if (error) return { error: error.message };
  return { ok: true };
}
