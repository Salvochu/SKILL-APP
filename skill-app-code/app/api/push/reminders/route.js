import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush, pushConfigured } from "@/lib/push";

// Nudge users who have reminders on (a push_subscriptions row) and have
// not trained in a few days. Called on a schedule by Vercel Cron, which
// sends `Authorization: Bearer ${CRON_SECRET}`. Idempotent enough: the
// cron runs once a day, so a user gets at most one nudge per run.

const DAYS_QUIET = 3;

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

  const [{ data: subs }, { data: sessions }] = await Promise.all([
    admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth"),
    admin.from("workout_sessions").select("user_id, started_at"),
  ]);

  const lastByUser = new Map();
  for (const s of sessions ?? []) {
    const t = new Date(s.started_at).getTime();
    if (!lastByUser.has(s.user_id) || t > lastByUser.get(s.user_id)) lastByUser.set(s.user_id, t);
  }

  const cutoff = Date.now() - DAYS_QUIET * 24 * 60 * 60 * 1000;
  let sent = 0;
  let cleaned = 0;

  for (const sub of subs ?? []) {
    const last = lastByUser.get(sub.user_id);
    if (last && last > cutoff) continue; // trained recently, leave them be

    const body = last
      ? "It has been a few days since your last session. Ready for the next one?"
      : "Your first workout is waiting. Pick a program and get started.";

    const result = await sendPush(sub, {
      title: "Time to train",
      body,
      url: "/dashboard",
    });
    if (result.ok) sent += 1;
    if (result.gone) {
      await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      cleaned += 1;
    }
  }

  return Response.json({ ok: true, subscriptions: subs?.length ?? 0, sent, cleaned });
}
