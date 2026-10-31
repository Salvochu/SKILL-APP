import { verifyStripeSignature, jsonResponse } from "@/lib/stripe/webhook";
import { lapseMembershipByEmail, activateFromCheckoutSession, recordMembershipEnd } from "@/lib/membership";

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

  // Also the start of a membership: a paid checkout from the app's own
  // "Keep training" button unlocks the account it was made for. (The
  // destination's name predates this; one endpoint and one signing
  // secret keep the Stripe setup simple.)
  if (event.type === "checkout.session.completed") {
    try {
      return jsonResponse(await activateFromCheckoutSession(event.data?.object));
    } catch (err) {
      console.error("stripe checkout activation failed:", err?.message);
      return jsonResponse({ error: "could not activate membership" }, 502);
    }
  }

  if (event.type !== "customer.subscription.deleted" && event.type !== "customer.subscription.updated") {
    return jsonResponse({ ok: true, skipped: `ignoring event type ${event.type}` });
  }

  // Only the app membership. The same Stripe account also runs 1:1
  // coaching and other subscriptions, and one of those ending must never
  // pause someone's app access. App subscriptions are the ones started
  // in the app (they carry the user id), on the in-app price, or on a
  // product listed in STRIPE_APP_PRODUCT_IDS (GHL's own "SKILL App
  // Membership" product, for anyone who paid through GHL's link).
  const subscription = event.data?.object;
  const appProducts = (process.env.STRIPE_APP_PRODUCT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const items = subscription?.items?.data ?? [];
  const isAppSubscription =
    Boolean(subscription?.metadata?.skill_user_id) ||
    items.some(
      (i) =>
        (process.env.STRIPE_PRICE_ID && i?.price?.id === process.env.STRIPE_PRICE_ID) ||
        appProducts.includes(i?.price?.product),
    );
  if (!isAppSubscription) {
    return jsonResponse({ ok: true, skipped: "not an app membership subscription" });
  }

  // Cancelled for the end of the month, or renewed: remember (or forget)
  // the date access stops. The account itself only pauses on "deleted".
  if (event.type === "customer.subscription.updated") {
    try {
      return jsonResponse(await recordMembershipEnd(subscription));
    } catch (err) {
      console.error("stripe subscription update failed:", err?.message);
      return jsonResponse({ error: "could not save the end date" }, 502);
    }
  }

  const customerId = subscription?.customer;
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
    // Subscriptions started in the app carry the user id; those also get
    // the GHL tag, since GHL's own cancellation trigger never sees them.
    const fromApp = Boolean(subscription?.metadata?.skill_user_id);
    const result = await lapseMembershipByEmail(email, { tagGhl: fromApp });
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
