"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser, getProfileRow, getAuthUserRecord } from "@/lib/data/session";
import { createMembershipCheckoutUrl, siteOrigin } from "@/lib/stripe/checkout";
import { KEEP_TRAINING_URL } from "@/lib/links";
import { safeNext } from "@/lib/safeNext";

// The in-app "Keep training for £7.99/mo" button: opens Stripe Checkout
// for this account (lib/stripe/checkout.js). Until STRIPE_PRICE_ID is
// set, or if Stripe can't be reached, it falls back to the GHL payment
// link, so the button always leads somewhere people can pay.
export async function startMembershipCheckout(formData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getProfileRow();
  if (profile?.membership === "member" || profile?.role === "coach") redirect("/dashboard");

  const record = await getAuthUserRecord();
  const url = await createMembershipCheckoutUrl({
    user,
    customerId: record?.app_metadata?.stripe_customer_id,
    site: siteOrigin(await headers()),
    back: safeNext(String(formData?.get("back") ?? "")),
  });
  redirect(url || KEEP_TRAINING_URL);
}
