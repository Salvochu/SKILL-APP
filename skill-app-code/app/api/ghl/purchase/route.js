import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// GHL calls this when the $7 purchase workflow fires. It verifies the
// request is really from GHL, creates a pre-confirmed Supabase user (no
// password), and returns a one-time link the buyer clicks to set their
// password. GHL's own workflow email step sends that link on.
//
// Setup:
//   - SUPABASE_SERVICE_ROLE_KEY  (server-only, from Supabase > Settings > API)
//   - GHL_WEBHOOK_PUBLIC_KEY     (optional; the Ed25519 PEM from GHL's
//                                 webhook docs is the built-in default)
//   - GHL_EXPECTED_PRODUCT_ID    (optional; if set, only that product is
//                                 accepted)
//   - NEXT_PUBLIC_SITE_URL       (optional; where the set-password link
//                                 points back, defaults to this origin)

// From GoHighLevel's Webhook Integration Guide. Overridable via env in
// case GHL rotates it.
const GHL_ED25519_PUBLIC_KEY =
  process.env.GHL_WEBHOOK_PUBLIC_KEY ||
  `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

function verifySignature(rawBody, req) {
  if (process.env.GHL_WEBHOOK_SKIP_VERIFY === "1") return true; // local testing only

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

function isTargetPurchase(payload) {
  const expected = process.env.GHL_EXPECTED_PRODUCT_ID;
  if (!expected) return true; // no filter configured: accept every call
  const ids = [
    payload?.product_id,
    payload?.productId,
    payload?.product?.id,
    payload?.customData?.product_id,
    ...(Array.isArray(payload?.line_items) ? payload.line_items.map((i) => i?.product_id) : []),
  ];
  return ids.some((id) => String(id) === String(expected));
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

  if (!isTargetPurchase(payload)) {
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
    options: { redirectTo: `${siteUrl}/auth/confirm?next=/auth/set-password` },
  });
  if (linkError || !linkData?.properties?.action_link) {
    console.error("ghl/purchase generateLink failed:", linkError?.message);
    return json({ error: "could not generate login link" }, 502);
  }

  return json({
    ok: true,
    email,
    is_new_user: !alreadyExisted,
    // GHL maps this into the workflow's follow-up email.
    set_password_url: linkData.properties.action_link,
  });
}

export function GET() {
  return json({ ok: true, endpoint: "ghl purchase webhook", method: "POST only" });
}
