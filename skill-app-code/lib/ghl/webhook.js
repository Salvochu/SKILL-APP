import crypto from "node:crypto";

// Shared plumbing for the GHL workflow webhooks (purchase, cancel). GHL's
// workflow "Custom Webhook" action does not sign its requests, so in
// production the endpoint is gated by a shared secret sent as
// "Authorization: Bearer <secret>" or "x-webhook-secret". The signed
// native-webhook paths (Ed25519, legacy RSA) are kept as fallbacks.

// From GoHighLevel's Webhook Integration Guide. Overridable via env in
// case GHL rotates it.
const GHL_ED25519_PUBLIC_KEY =
  process.env.GHL_WEBHOOK_PUBLIC_KEY ||
  `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

export const jsonResponse = (body, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

// Constant-time compare of two short ASCII strings.
function secretMatches(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyGhlSignature(rawBody, req) {
  if (process.env.GHL_WEBHOOK_SKIP_VERIFY === "1") return true; // local testing only

  // Preferred path: a shared secret we set on both ends.
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

// GHL payloads vary (native contact webhook vs a hand-built custom body),
// so try the common shapes, then fall back to the first email-looking
// string anywhere in the object.
export function extractContact(payload) {
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
