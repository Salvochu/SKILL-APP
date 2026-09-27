import { verifyStripeSignature, jsonResponse } from "@/lib/stripe/webhook";
import { lapseMembershipByEmail } from "@/lib/membership";

// Stripe fires this the moment a subscription is actually, definitively
// cancelled - whether that's someone using the Customer Portal, or Smart
// Retries finally giving up after the retry schedule. This is the
// source-of-truth path: GHL's own equivalent workflow can only guess at
// when a subscription's billing cycle actually ends (their own support
// confirmed there is no reliable way for them to know), so this listens
// to Stripe directly instead.
//
// Setup: Stripe Dashboard -> Developers -> Webhooks -> add an endpoint
// here, listening for customer.subscription.deleted.
//   STRIPE_WEBHOOK_SECRET  the destination's signing secret (whsec_...)
//   STRIPE_SECRET_KEY      a *restricted* key, Customers: Read only -
//                          just enough to look up the cancelled
//                          subscription's customer email
export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    return jsonResponse({ error: "signature verification failed" }, 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  if (event.type !== "customer.subscription.deleted") {
    return jsonResponse({ ok: true, skipped: `ignoring event type ${event.type}` });
  }

  const customerId = event.data?.object?.customer;
  if (!customerId) {
    return jsonResponse({ error: "no customer id on event" }, 422);
  }

  const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    console.error("stripe/subscription-canceled: customer lookup failed", res.status);
    return jsonResponse({ error: "could not look up customer" }, 502);
  }
  const customer = await res.json();
  const email = customer.email?.trim().toLowerCase();
  if (!email) {
    return jsonResponse({ ok: true, skipped: "customer has no email" });
  }

  try {
    const result = await lapseMembershipByEmail(email);
    return jsonResponse({ ...result, email });
  } catch (err) {
    console.error("stripe/subscription-canceled failed:", err?.message);
    return jsonResponse({ error: "could not update membership" }, 502);
  }
}

export function GET() {
  return jsonResponse({
    ok: true,
    endpoint: "stripe subscription-canceled webhook",
    method: "POST only",
  });
}
