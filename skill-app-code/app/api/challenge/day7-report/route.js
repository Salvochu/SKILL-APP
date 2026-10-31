import { createAdminClient } from "@/lib/supabase/admin";
import { selectAll } from "@/lib/supabase/selectAll";
import { CHALLENGE_TEMPLATE_ID, isChallengeDayComplete } from "@/lib/data/challenge";
import { updateGhlTags } from "@/lib/ghl";

// Daily report (Vercel Cron, Authorization: Bearer CRON_SECRET). For
// anyone whose challenge day is exactly 7 today, splits them into
// "doing well" and "struggling" (missed 2+ of their first 7 days) and
// posts a formatted summary to a GHL inbound webhook. This is purely
// informational for the coach to decide who to reach out to personally -
// no in-app upsell or pressure on the challenge itself.
//
// The same daily run also tags everyone on their real Day 14 with
// "challenge day 14" in GHL, which triggers the "your 14 days are up"
// email. The day counts from when they tapped "Start my 14 days", which
// GHL can't know (a fixed wait after sign-up lands days early).
const DAY = 24 * 60 * 60 * 1000;
const FINAL_DAY = 14;
const REPORT_DAY = 7;
const STRUGGLING_MISSED_THRESHOLD = 2;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("forbidden", { status: 403 });
  }
  const webhookUrl = process.env.CHALLENGE_DAY7_REPORT_WEBHOOK_URL;

  const admin = createAdminClient();

  const { data: profileRows } = await admin
    .from("profiles")
    .select("user_id, full_name")
    .eq("membership", "challenge");
  const profileIds = (profileRows ?? []).map((p) => p.user_id);
  if (!profileIds.length) {
    return Response.json({ ok: true, day7Count: 0, sent: false, day14Tagged: 0 });
  }
  const nameByUser = new Map((profileRows ?? []).map((p) => [p.user_id, p.full_name || ""]));

  const [{ data: runs }, { data: checklistRows }] = await Promise.all([
    admin
      .from("user_mesocycles")
      .select("user_id, started_at")
      .eq("template_id", CHALLENGE_TEMPLATE_ID)
      .eq("status", "active")
      .in("user_id", profileIds),
    selectAll(() =>
      admin
        .from("challenge_checklist")
        .select("user_id, day, items")
        .in("user_id", profileIds)
        .order("user_id")
        .order("day"),
    ),
  ]);

  const completeDaysByUser = new Map(); // user_id -> Set<day>
  for (const row of checklistRows ?? []) {
    if (!isChallengeDayComplete(row.items)) continue;
    if (!completeDaysByUser.has(row.user_id)) completeDaysByUser.set(row.user_id, new Set());
    completeDaysByUser.get(row.user_id).add(row.day);
  }

  const todayMs = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const challengeDayOf = (startedAt) =>
    Math.max(0, Math.floor((todayMs - Date.parse(`${startedAt}T00:00:00Z`)) / DAY)) + 1;

  // Day 14 tags for GHL (see the note at the top). Only challenge
  // accounts are in `runs`, so anyone who already paid is left out.
  const finalDayRuns = (runs ?? []).filter((r) => r.started_at && challengeDayOf(r.started_at) === FINAL_DAY);
  await Promise.all(
    finalDayRuns.map(async (r) => {
      const { data } = await admin.auth.admin.getUserById(r.user_id);
      await updateGhlTags(data?.user?.email, { add: ["challenge day 14"] });
    }),
  );
  const day14Tagged = finalDayRuns.length;

  const day7Users = [];
  for (const run of runs ?? []) {
    if (!run.started_at) continue;
    const challengeDay = challengeDayOf(run.started_at);
    if (challengeDay !== REPORT_DAY) continue;

    const complete = completeDaysByUser.get(run.user_id) ?? new Set();
    let completeCount = 0;
    for (let d = 1; d <= REPORT_DAY; d++) {
      if (complete.has(d)) completeCount++;
    }
    // Same streak definition as lib/data/challenge.js's
    // getChallengeChecklist: consecutive complete days counting back from
    // today, where today not being done yet doesn't itself break it.
    let streak = 0;
    for (let d = challengeDay; d >= 1; d--) {
      if (complete.has(d)) streak++;
      else if (d < challengeDay) break;
    }

    const missed = REPORT_DAY - completeCount;
    day7Users.push({
      userId: run.user_id,
      name: nameByUser.get(run.user_id) || "",
      completeCount,
      missed,
      streak,
      struggling: missed >= STRUGGLING_MISSED_THRESHOLD,
    });
  }

  if (!day7Users.length) {
    return Response.json({ ok: true, day7Count: 0, sent: false, day14Tagged });
  }
  if (!webhookUrl) {
    return Response.json({ ok: true, day7Count: day7Users.length, sent: false, reason: "report webhook not configured", day14Tagged });
  }

  // Emails live in auth.users, not profiles.
  const emails = await Promise.all(
    day7Users.map((u) => admin.auth.admin.getUserById(u.userId).then(({ data }) => data?.user?.email ?? "")),
  );
  day7Users.forEach((u, i) => {
    u.email = emails[i];
  });

  const doingWell = day7Users.filter((u) => !u.struggling);
  const struggling = day7Users.filter((u) => u.struggling);

  const row = (u) => {
    const label = u.name ? `${u.name} (${u.email})` : u.email;
    return `<li>${label} &mdash; ${u.completeCount}/${REPORT_DAY} days complete, ${u.streak}-day streak</li>`;
  };
  const section = (title, list) =>
    `<p><strong>${title} (${list.length})</strong></p>` +
    (list.length ? `<ul>${list.map(row).join("")}</ul>` : "<p>None today.</p>");

  const reportHtml = section("Doing well", doingWell) + section("Struggling", struggling);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      doing_well_count: doingWell.length,
      struggling_count: struggling.length,
      report_html: reportHtml,
    }),
  });

  return Response.json({
    ok: true,
    day7Count: day7Users.length,
    doingWell: doingWell.length,
    struggling: struggling.length,
    webhookStatus: res.status,
    day14Tagged,
  });
}
