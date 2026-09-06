import "server-only";
import { createClient } from "@/lib/supabase/server";

export const DEFAULT_PREFS = {
  quietDayNudge: true,
  scheduledEnabled: false,
  scheduledDays: [],
  weeklyRecap: false,
  streakAtRisk: false,
  restTimerDone: false,
  unfinishedWorkout: true,
  restTimerEnabled: true,
};

function fromRow(row) {
  if (!row) return { ...DEFAULT_PREFS };
  return {
    quietDayNudge: row.quiet_day_nudge ?? true,
    scheduledEnabled: row.scheduled_enabled ?? false,
    scheduledDays: Array.isArray(row.scheduled_days) ? row.scheduled_days : [],
    weeklyRecap: row.weekly_recap ?? false,
    streakAtRisk: row.streak_at_risk ?? false,
    restTimerDone: row.rest_timer_done ?? false,
    unfinishedWorkout: row.unfinished_workout ?? true,
    restTimerEnabled: row.rest_timer_enabled ?? true,
  };
}

export async function getNotificationPrefs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...DEFAULT_PREFS };

  const { data } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return fromRow(data);
}
