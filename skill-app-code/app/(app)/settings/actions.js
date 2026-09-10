"use server";

import { getServerSupabase, getSessionUser } from "@/lib/data/session";

const BOOL_KEYS = {
  quietDayNudge: "quiet_day_nudge",
  scheduledEnabled: "scheduled_enabled",
  weeklyRecap: "weekly_recap",
  streakAtRisk: "streak_at_risk",
  restTimerDone: "rest_timer_done",
  unfinishedWorkout: "unfinished_workout",
  restTimerEnabled: "rest_timer_enabled",
  inlineVideos: "inline_videos",
};

// Merge a partial set of preference changes into the user's row.
export async function saveNotificationPrefs(patch) {
  const supabase = await getServerSupabase();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };

  const row = { user_id: user.id, updated_at: new Date().toISOString() };
  for (const [key, col] of Object.entries(BOOL_KEYS)) {
    if (key in patch) row[col] = Boolean(patch[key]);
  }
  if ("scheduledDays" in patch) {
    const days = Array.isArray(patch.scheduledDays) ? patch.scheduledDays : [];
    row.scheduled_days = [...new Set(days.map(Number).filter((n) => n >= 0 && n <= 6))].sort();
  }
  if ("defaultRestSeconds" in patch) {
    const s = Math.round(Number(patch.defaultRestSeconds));
    row.default_rest_seconds = Number.isFinite(s) ? Math.min(600, Math.max(15, s)) : 90;
  }

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(row, { onConflict: "user_id" });
  if (error) return { error: error.message };
  return { ok: true };
}
