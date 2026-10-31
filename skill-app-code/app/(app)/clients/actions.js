"use server";

import { headers } from "next/headers";
import { getIsCoach } from "@/lib/data/coach";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The free challenge's mesocycle template (migration 0033).
const CHALLENGE_TEMPLATE_ID = "main-character-14";

// Coach only: give someone full app access without the challenge or a
// purchase (a 1:1 client, a tester). Same account mechanics as the GHL
// purchase webhook (app/api/ghl/purchase/route.js): a pre-confirmed user
// with no password, marked as a member, plus a one-time link that lets
// them set a password. The app has no mailer of its own, so the link
// comes back to the coach to send however they like (WhatsApp, DM).
//
// Inviting an email that already has an account is safe: it just
// returns a fresh link, and upgrades a challenge or lapsed account to a
// member (never touches the coach).
export async function inviteToSkill({ name, email } = {}) {
  if (!(await getIsCoach())) return { error: "Only the coach can invite people." };

  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim().slice(0, 80);
  if (!EMAIL_RE.test(cleanEmail)) return { error: "That email doesn't look right." };

  const admin = createAdminClient();

  const { error: createError } = await admin.auth.admin.createUser({
    email: cleanEmail,
    email_confirm: true,
    user_metadata: { name: cleanName, source: "coach_invite" },
    // No Stripe subscription behind this access: Profile hides "Manage
    // membership" (see AccountCard). Only the service role can write it.
    app_metadata: { billing: "coach" },
  });
  const alreadyExisted =
    createError &&
    (createError.status === 422 || /already been registered|already exists/i.test(createError.message || ""));
  if (createError && !alreadyExisted) {
    console.error("inviteToSkill createUser failed:", createError.message);
    return { error: "Couldn't create the account. Try again." };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: cleanEmail,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  const userId = linkData?.user?.id;
  if (linkError || !tokenHash || !userId) {
    console.error("inviteToSkill generateLink failed:", linkError?.message);
    return { error: "Couldn't create their login link. Try again." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("membership, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.membership !== "coach") {
    const patch = { user_id: userId, membership: "member" };
    if (cleanName && !profile?.full_name?.trim()) patch.full_name = cleanName;
    const { error: upsertError } = await admin.from("profiles").upsert(patch, { onConflict: "user_id" });
    if (upsertError) {
      console.error("inviteToSkill profile upsert failed:", upsertError.message);
      return { error: "The account exists but access couldn't be set. Try again." };
    }
    // A challenge account still mid-run would keep showing the Day 14
    // fork; close it out, same as a purchase does.
    await admin
      .from("user_mesocycles")
      .update({ status: "completed" })
      .eq("user_id", userId)
      .eq("template_id", CHALLENGE_TEMPLATE_ID)
      .eq("status", "active");
  }

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  // Our own confirm URL (as the webhook builds it): verifies on any
  // device and lands on the set-password screen.
  const url =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=recovery&next=${encodeURIComponent("/auth/set-password")}`;

  return { ok: true, email: cleanEmail, name: cleanName, isNew: !alreadyExisted, url, appHost: new URL(origin).host };
}
