import crypto from "node:crypto";

export const jsonResponse = (body, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

// Stripe's documented webhook signature scheme: the Stripe-Signature
// header carries "t=<timestamp>,v1=<hex hmac>" (possibly more than one
// v1 during a secret rotation). Recompute the same HMAC over
// "<timestamp>.<raw body>" with the endpoint's signing secret and accept
// if any v1 value matches, within a 5 minute tolerance to block replay.
const TOLERANCE_SECONDS = 300;

export function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  const timestamp = sigHeader.match(/(?:^|,)t=([^,]+)/)?.[1];
  if (!timestamp) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected);

  const candidates = sigHeader.match(/v1=([^,]+)/g) ?? [];
  return candidates.some((kv) => {
    const sig = kv.slice(3);
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}
