import { NextResponse } from "next/server";
import { getSessionUser, getAuthUserRecord } from "@/lib/data/session";
import { createBillingPortalUrl, siteOrigin } from "@/lib/stripe/checkout";
import { MANAGE_MEMBERSHIP_URL } from "@/lib/links";

// Profile's "Manage membership": straight into the member's own Stripe
// billing page, already signed in (lib/stripe/checkout.js). If that can't
// be made, Stripe's own sign-in page, which emails them a code.
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/profile", request.url));

  // app_metadata comes from the auth server and only the service role
  // can write it, so the saved customer id can't be swapped by the user.
  const record = await getAuthUserRecord();
  const url = await createBillingPortalUrl({
    user,
    customerId: record?.app_metadata?.stripe_customer_id,
    site: siteOrigin(request.headers),
  });
  return NextResponse.redirect(url || MANAGE_MEMBERSHIP_URL, 303);
}
