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
export async function createMembershipCheckoutUrl({ user, site, back = "/dashboard" }) {
  const price = process.env.STRIPE_PRICE_ID;
  if (!price || !user?.email) return null;
  try {
    // Someone who paid before (a lapsed member coming back) keeps their
    // Stripe customer, so their invoices and card stay in one place.
    const existing = await stripe("GET", "/customers", { email: user.email, limit: 1 });
    const customer = existing?.data?.[0]?.id;
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
// member's own subscription: cancel, change card, invoices, with no email
// code to sign in. Uses the Stripe customer saved when they paid in the
// app, otherwise the Stripe customer with their login email (members who
// paid through GHL). Returns null if there's no customer or Stripe
// refuses, so callers can fall back to the portal's email sign-in page.
export async function createBillingPortalUrl({ user, customerId, site, back = "/profile" }) {
  try {
    let customer = customerId;
    if (!customer && user?.email) {
      const existing = await stripe("GET", "/customers", { email: user.email, limit: 1 });
      customer = existing?.data?.[0]?.id;
    }
    if (!customer) return null;
    const session = await stripe("POST", "/billing_portal/sessions", {
      customer,
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
