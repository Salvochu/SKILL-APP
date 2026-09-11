import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonResponse as json,
  verifyGhlSignature,
  extractContact,
} from "@/lib/ghl/webhook";

// GHL calls this when the $7 purchase workflow fires. It verifies the
// request is really from GHL, creates a pre-confirmed Supabase user (no
// password), and returns a one-time link the buyer clicks to set their
// password. GHL's own workflow email step sends that link on.
//
// Setup:
//   - SUPABASE_SERVICE_ROLE_KEY  (server-only, from Supabase > Settings > API)
//   - GHL_WEBHOOK_SECRET         (shared secret; GHL sends it back as the
//                                 Authorization header or x-webhook-secret.
//                                 Used because GHL's workflow Custom Webhook
//                                 action does not sign its requests.)
//   - GHL_WEBHOOK_PUBLIC_KEY     (optional; Ed25519 PEM, for the signed
//                                 native webhook trigger instead of a secret)
//   - GHL_EXPECTED_PRODUCT_ID    (optional; the paid app product id. If
//                                 set, only it and the challenge product
//                                 are accepted as paying members)
//   - GHL_CHALLENGE_PRODUCT_ID   (optional; the free 14-day challenge
//                                 product / form id. Defaults to
//                                 "main-character-challenge". A call
//                                 carrying this id creates a challenge
//                                 account and starts the 14-day plan)
//   - NEXT_PUBLIC_SITE_URL       (optional; where the set-password link
//                                 points back, defaults to this origin)

// The mesocycle template the free challenge runs on (migration 0033).
const CHALLENGE_TEMPLATE_ID = "main-character-14";
const CHALLENGE_PRODUCT_ID = process.env.GHL_CHALLENGE_PRODUCT_ID || "main-character-challenge";

function productIdsIn(payload) {
  return [
    payload?.product_id,
    payload?.productId,
    payload?.product?.id,
    payload?.customData?.product_id,
    payload?.plan,
    ...(Array.isArray(payload?.line_items) ? payload.line_items.map((i) => i?.product_id) : []),
  ]
    .filter((v) => v != null)
    .map((v) => String(v));
}

// "challenge" -> free 14-day challenge sign-up, "member" -> paid app
// purchase or subscription, null -> ignore (not one of our products).
// GHL_EXPECTED_PRODUCT_ID accepts a comma-separated list, so the £14.99
// subscription and any older paid product both count.
function classifyPurchase(payload) {
  const ids = productIdsIn(payload);
  if (ids.some((id) => id === String(CHALLENGE_PRODUCT_ID))) return "challenge";

  const paid = (process.env.GHL_EXPECTED_PRODUCT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (paid.length === 0) return "member"; // no filter configured: treat every other call as a member
  return ids.some((id) => paid.includes(id)) ? "member" : null;
}

export async function POST(request) {
  const rawBody = await request.text();

  if (!verifyGhlSignature(rawBody, request)) {
    return json({ error: "signature verification failed" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const plan = classifyPurchase(payload);
  if (!plan) {
    return json({ ok: true, skipped: "not the target product" });
  }

  const { email, name, age } = extractContact(payload);
  if (!email) {
    return json({ error: "no email found in payload" }, 422);
  }

  const supabase = createAdminClient();

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, source: "ghl_purchase" },
  });
  const alreadyExisted =
    createError &&
    (createError.status === 422 ||
      /already been registered|already exists/i.test(createError.message || ""));
  if (createError && !alreadyExisted) {
    console.error("ghl/purchase createUser failed:", createError.message);
    return json({ error: "could not create account" }, 502);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error("ghl/purchase generateLink failed:", linkError?.message);
    return json({ error: "could not generate login link" }, 502);
  }

  // Flag the account and, for the challenge, start the 14-day plan. The
  // login link above is the critical path, so a failure here is logged
  // and swallowed rather than failing the webhook.
  const userId = linkData?.user?.id ?? null;
  if (userId) {
    try {
      await applyPlan(supabase, userId, plan, name, age);
    } catch (err) {
      console.error("ghl/purchase applyPlan failed:", err?.message);
    }
  }

  // Build our own confirm URL from the token hash rather than using
  // Supabase's action_link: this one keeps the /auth/set-password
  // destination and verifies cross-device (no PKCE verifier needed).
  const setPasswordUrl =
    `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}` +
    `&type=recovery&next=${encodeURIComponent("/auth/set-password")}`;

  return json({
    ok: true,
    email,
    plan,
    is_new_user: !alreadyExisted,
    // GHL maps this into the workflow's follow-up email.
    set_password_url: setPasswordUrl,
  });
}

// Set the membership flag and, for a challenge sign-up, start the 14-day
// plan. Runs through the admin client (RLS bypassed).
async function applyPlan(supabase, userId, plan, name, age) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("membership, full_name, age")
    .eq("user_id", userId)
    .maybeSingle();

  // Carry the name and age GHL sent over onto the profile if it has none
  // yet, so the app can greet them and skip re-asking without a second
  // trip to the questionnaire.
  const cleanName = String(name || "").trim().slice(0, 80);
  const namePatch = cleanName && !profile?.full_name?.trim() ? { full_name: cleanName } : {};
  const agePatch = age != null && profile?.age == null ? { age } : {};
  const patch = { ...namePatch, ...agePatch };

  if (plan === "member") {
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, membership: "member", ...patch }, { onConflict: "user_id" });
    return;
  }

  // plan === "challenge": never overwrite an existing member, a lapsed
  // member (they belong on the £14.99 path, not the free challenge) or
  // the coach.
  const KEEP = new Set(["member", "coach", "lapsed"]);
  if (!KEEP.has(profile?.membership)) {
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, membership: "challenge", ...patch }, { onConflict: "user_id" });
  } else if (Object.keys(patch).length) {
    await supabase.from("profiles").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  }

  // Start the 14-day plan once per account: never if they have ever run
  // the challenge before (it is a one-time thing), and never on top of
  // an active run of anything.
  const [{ data: priorChallenge }, { data: activeRun }] = await Promise.all([
    supabase
      .from("user_mesocycles")
      .select("id")
      .eq("user_id", userId)
      .eq("template_id", CHALLENGE_TEMPLATE_ID)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_mesocycles")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);
  if (!priorChallenge && !activeRun) {
    await supabase.from("user_mesocycles").insert({
      user_id: userId,
      template_id: CHALLENGE_TEMPLATE_ID,
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
      variant: "Full Gym",
    });
  }
}

export function GET() {
  return json({ ok: true, endpoint: "ghl purchase webhook", method: "POST only" });
}
