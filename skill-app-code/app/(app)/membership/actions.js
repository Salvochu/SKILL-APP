"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser, getProfileRow } from "@/lib/data/session";
import { stripe } from "@/lib/stripe/api";
import { KEEP_TRAINING_URL } from "@/lib/links";
import { safeNext } from "@/lib/safeNext";

// Opens Stripe's checkout for the £7.99/mo membership, made for the
// signed-in account: their login email is filled in and can't be
// changed, and the session carries their user id, so paying unlocks
// this exact account (lib/membership.js activateFromCheckoutSession),
// never a different one that happens to share an email.
//
// Until STRIPE_PRICE_ID is set, or if Stripe can't be reached, it falls
// back to the GHL payment link this used before, so the button always
// leads somewhere people can pay.
export async function startMembershipCheckout(formData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getProfileRow();
  if (profile?.membership === "member" || profile?.role === "coach") redirect("/dashboard");

  const price = process.env.STRIPE_PRICE_ID;
  if (!price || !user.email) redirect(KEEP_TRAINING_URL);

  const back = safeNext(String(formData?.get("back") ?? ""));
  const h = await headers();
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  let url = null;
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
    url = session?.url ?? null;
  } catch (err) {
    console.error("membership checkout failed:", err.message);
  }
  redirect(url || KEEP_TRAINING_URL);
}
