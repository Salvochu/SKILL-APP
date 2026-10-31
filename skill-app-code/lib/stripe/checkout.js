import "server-only";
import { stripe } from "@/lib/stripe/api";

// A Stripe Checkout page for the £7.99/mo membership, made for one
// signed-in account: their login email filled in and locked, and their
// user id on the session, so paying unlocks this exact account
// (lib/membership.js activateFromCheckoutSession), never a different one
// that happens to share an email. `back` is the app path to return to if
// they back out. Returns the page's URL, or null if it can't be made
// (STRIPE_PRICE_ID unset, or Stripe unreachable), so callers can fall
// back to the GHL payment link.
//
// Each member gets their own Stripe customer for the app, saved on their
// account when they first pay (customerId). It is never matched by email,
// because the same email may already be a 1:1 coaching customer, and
// Stripe's billing page shows every subscription a customer has: this
// way it only ever shows the app membership. A returning member reuses
// theirs, so their invoices and card stay in one place.
export async function createMembershipCheckoutUrl({ user, customerId, site, back = "/dashboard" }) {
  const price = process.env.STRIPE_PRICE_ID;
  if (!price || !user?.email) return null;
  try {
    const customer = customerId || null;
    const session = await stripe("POST", "/checkout/sessions", {
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      ...(customer ? { customer } : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: { skill_user_id: user.id },
      subscription_data: { metadata: { skill_user_id: user.id } },
      success_url: `${site}/api/stripe/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}${back}`,
    });
    return session?.url ?? null;
  } catch (err) {
    console.error("membership checkout failed:", err.message);
    return null;
  }
}

// Stripe's billing page (the Customer Portal) opened straight into one
// member's app subscription: cancel, change card, invoices, with no email
// code to sign in. Only ever the app's own customer saved on their
// account (see above), so nothing else they pay for shows up there.
// Returns null without one, or if Stripe refuses, so callers can fall
// back to the portal's email sign-in page.
export async function createBillingPortalUrl({ customerId, site, back = "/profile" }) {
  if (!customerId) return null;
  try {
    const session = await stripe("POST", "/billing_portal/sessions", {
      customer: customerId,
      return_url: `${site}${back}`,
    });
    return session?.url ?? null;
  } catch (err) {
    console.error("billing portal failed:", err.message);
    return null;
  }
}

// The app's own origin, for the URLs Stripe sends people back to.
export function siteOrigin(headers) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    `${headers.get("x-forwarded-proto") ?? "https"}://${headers.get("host")}`
  );
}
