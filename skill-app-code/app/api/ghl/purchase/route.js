import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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

// From GoHighLevel's Webhook Integration Guide. Overridable via env in
// case GHL rotates it.
const GHL_ED25519_PUBLIC_KEY =
  process.env.GHL_WEBHOOK_PUBLIC_KEY ||
  `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

// Constant-time compare of two short ASCII strings.
function secretMatches(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifySignature(rawBody, req) {
  if (process.env.GHL_WEBHOOK_SKIP_VERIFY === "1") return true; // local testing only

  // Preferred path: a shared secret we set on both ends. GHL's workflow
  // Custom Webhook action sends it as "Authorization: Bearer <secret>" or
  // as an "x-webhook-secret" header. It does not sign its requests, so
  // this is what actually gates the endpoint in production.
  const expectedSecret = process.env.GHL_WEBHOOK_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.replace(/^Bearer\s+/i, "");
    const headerSecret = req.headers.get("x-webhook-secret");
    if (secretMatches(bearer, expectedSecret) || secretMatches(headerSecret, expectedSecret)) {
      return true;
    }
    // A secret is configured but the request did not carry it: reject,
    // regardless of any signature header.
    return false;
  }

  const ed = req.headers.get("x-ghl-signature");
  if (ed && ed !== "N/A") {
    try {
      return crypto.verify(
        null,
        Buffer.from(rawBody, "utf8"),
        GHL_ED25519_PUBLIC_KEY,
        Buffer.from(ed, "base64"),
      );
    } catch {
      return false;
    }
  }

  // Legacy RSA-SHA256 header, deprecated by GHL in 2026.
  const rsa = req.headers.get("x-wh-signature");
  const rsaKey = process.env.GHL_WEBHOOK_PUBLIC_KEY_RSA;
  if (rsa && rsaKey) {
    try {
      const v = crypto.createVerify("SHA256");
      v.update(rawBody);
      v.end();
      return v.verify(rsaKey, Buffer.from(rsa, "base64"));
    } catch {
      return false;
    }
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GHL payloads vary (native contact webhook vs a hand-built custom body),
// so try the common shapes, then fall back to the first email-looking
// string anywhere in the object.
function extractContact(payload) {
  const p = payload || {};
  const candidates = [
    p.email,
    p.contact_email,
    p.contactEmail,
    p.customData?.email,
    p.contact?.email,
    p.data?.email,
  ];
  let email = candidates.find((e) => typeof e === "string" && EMAIL_RE.test(e.trim()));
  if (!email) email = deepFindEmail(p);
  email = email?.trim().toLowerCase() || null;

  const first = p.first_name || p.firstName || p.contact?.firstName || p.customData?.first_name;
  const last = p.last_name || p.lastName || p.contact?.lastName || p.customData?.last_name;
  const name =
    p.name || p.full_name || p.fullName || [first, last].filter(Boolean).join(" ") || null;

  return { email, name: name || null };
}

function deepFindEmail(obj, seen = new Set()) {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return null;
  seen.add(obj);
  for (const value of Object.values(obj)) {
    if (typeof value === "string" && EMAIL_RE.test(value.trim())) return value;
    if (value && typeof value === "object") {
      const found = deepFindEmail(value, seen);
      if (found) return found;
    }
  }
  return null;
}

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

  if (!verifySignature(rawBody, request)) {
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

  const { email, name } = extractContact(payload);
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
      await applyPlan(supabase, userId, plan, name);
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
async function applyPlan(supabase, userId, plan, name) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("membership, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  // Carry the name GHL sent over onto the profile if it has none yet, so
  // the app can greet them without asking again.
  const cleanName = String(name || "").trim().slice(0, 80);
  const namePatch = cleanName && !profile?.full_name?.trim() ? { full_name: cleanName } : {};

  if (plan === "member") {
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, membership: "member", ...namePatch }, { onConflict: "user_id" });
    return;
  }

  // plan === "challenge": never downgrade an existing member or the coach.
  if (profile?.membership !== "member" && profile?.membership !== "coach") {
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, membership: "challenge", ...namePatch }, { onConflict: "user_id" });
  } else if (Object.keys(namePatch).length) {
    await supabase.from("profiles").upsert({ user_id: userId, ...namePatch }, { onConflict: "user_id" });
  }

  // Start the 14-day plan unless they already have a run going.
  const { data: activeRun } = await supabase
    .from("user_mesocycles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!activeRun) {
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
