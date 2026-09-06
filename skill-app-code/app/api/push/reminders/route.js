import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush, pushConfigured } from "@/lib/push";

// The one scheduled job. Runs daily (Vercel Cron, Authorization: Bearer
// CRON_SECRET) and sends each user at most one push, chosen by priority
// from what their notification_prefs allow:
//   1. Weekly recap        (Mondays)
//   2. Scheduled reminder   (their chosen weekdays)
//   3. Streak at risk       (Sundays, streak alive, nothing logged this week)
//   4. Training nudge       (a few quiet days)

const DAY = 24 * 60 * 60 * 1000;
const QUIET_DAYS = 3;

// Monday-00:00 UTC of the ISO week containing `ms`.
function weekStart(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.getTime();
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response("forbidden", { status: 403 });
  }
  if (!pushConfigured()) {
    return Response.json({ error: "push not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const dow = new Date(now).getUTCDay(); // 0 Sun .. 6 Sat
  const isMonday = dow === 1;
  const isSunday = dow === 0;
  const thisWeek = weekStart(now);
  const lastWeek = thisWeek - 7 * DAY;
  const todayStart = new Date(now).setUTCHours(0, 0, 0, 0);

  const [{ data: subs }, { data: prefsRows }, { data: sessions }] = await Promise.all([
    admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth"),
    admin.from("notification_prefs").select("*"),
    admin.from("workout_sessions").select("id, user_id, started_at"),
  ]);

  const prefsByUser = new Map((prefsRows ?? []).map((p) => [p.user_id, p]));

  // Per-user session stats.
  const stats = new Map(); // user_id -> { last, trainedToday, thisWeekCount, lastWeekCount, lastWeekIds, trainedLastWeek, trainedPrevWeek }
  for (const s of sessions ?? []) {
    const t = new Date(s.started_at).getTime();
    let st = stats.get(s.user_id);
    if (!st) {
      st = { last: 0, trainedToday: false, thisWeekCount: 0, lastWeekIds: [], trainedLastWeek: false, trainedPrevWeek: false };
      stats.set(s.user_id, st);
    }
    if (t > st.last) st.last = t;
    if (t >= todayStart) st.trainedToday = true;
    if (t >= thisWeek) st.thisWeekCount += 1;
    if (t >= lastWeek && t < thisWeek) {
      st.lastWeekIds.push(s.id);
      st.trainedLastWeek = true;
    }
    if (t >= lastWeek - 7 * DAY && t < lastWeek) st.trainedPrevWeek = true;
  }

  // Volume for last week's sessions, only if any recap is possible today.
  const recapUserIds = isMonday
    ? [...prefsByUser.entries()].filter(([, p]) => p.weekly_recap).map(([id]) => id)
    : [];
  const lastWeekVolume = new Map();
  if (recapUserIds.length) {
    const ids = recapUserIds.flatMap((id) => stats.get(id)?.lastWeekIds ?? []);
    if (ids.length) {
      const { data: sets } = await admin
        .from("workout_sets")
        .select("session_id, weight, reps, completed")
        .in("session_id", ids);
      const sessionUser = new Map((sessions ?? []).map((s) => [s.id, s.user_id]));
      for (const row of sets ?? []) {
        if (row.completed === false) continue;
        const uid = sessionUser.get(row.session_id);
        if (!uid) continue;
        const v = (Number(row.weight) || 0) * (Number(row.reps) || 0);
        lastWeekVolume.set(uid, (lastWeekVolume.get(uid) || 0) + v);
      }
    }
  }

  const EMPTY_STATS = {
    last: 0,
    trainedToday: false,
    thisWeekCount: 0,
    lastWeekIds: [],
    trainedLastWeek: false,
    trainedPrevWeek: false,
  };

  function pick(userId) {
    const p = prefsByUser.get(userId) ?? {};
    const st = stats.get(userId) ?? EMPTY_STATS;

    if (isMonday && p.weekly_recap && st.trainedLastWeek) {
      const kg = Math.round(lastWeekVolume.get(userId) || 0);
      const vol = kg >= 1000 ? `${(kg / 1000).toFixed(1)}k kg` : `${kg} kg`;
      const n = st.lastWeekIds.length;
      return {
        title: "Last week",
        body: `${n} workout${n === 1 ? "" : "s"}, ${vol} lifted. Keep it going this week.`,
        url: "/progress",
      };
    }

    if (
      p.scheduled_enabled &&
      Array.isArray(p.scheduled_days) &&
      p.scheduled_days.includes(dow) &&
      !st.trainedToday
    ) {
      return { title: "Training day", body: "You have a session scheduled today. Time to train.", url: "/dashboard" };
    }

    if (isSunday && p.streak_at_risk && st.trainedPrevWeek && st.thisWeekCount === 0) {
      return {
        title: "Your streak is on the line",
        body: "Log a workout today to keep your weekly streak alive.",
        url: "/dashboard",
      };
    }

    if (p.quiet_day_nudge !== false) {
      const quiet = !st.last || st.last < now - QUIET_DAYS * DAY;
      if (quiet) {
        return {
          title: "Time to train",
          body: st.last
            ? "It has been a few days since your last session. Ready for the next one?"
            : "Your first workout is waiting. Pick a program and get started.",
          url: "/dashboard",
        };
      }
    }

    return null;
  }

  let sent = 0;
  let cleaned = 0;
  for (const sub of subs ?? []) {
    const payload = pick(sub.user_id);
    if (!payload) continue;
    const result = await sendPush(sub, payload);
    if (result.ok) sent += 1;
    if (result.gone) {
      await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      cleaned += 1;
    }
  }

  return Response.json({ ok: true, subscriptions: subs?.length ?? 0, sent, cleaned });
}
