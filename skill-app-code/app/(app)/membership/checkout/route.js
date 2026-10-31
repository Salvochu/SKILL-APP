import { NextResponse } from "next/server";
import { getSessionUser, getProfileRow, getAuthUserRecord } from "@/lib/data/session";
import { createMembershipCheckoutUrl, siteOrigin } from "@/lib/stripe/checkout";
import { KEEP_TRAINING_URL } from "@/lib/links";

// app.salvadorskfitness.com/membership/checkout: a permanent link that
// goes straight to the membership checkout, for emails, DMs and
// WhatsApp. The checkout itself can't live in a link (it is made for one
// account and expires), so it is made here, at the moment someone opens
// this. Signed out: proxy.js sends them to sign in first and back here.
// Already a member (or the coach): the dashboard.
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/membership/checkout", request.url));

  const profile = await getProfileRow();
  if (profile?.membership === "member" || profile?.role === "coach") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const record = await getAuthUserRecord();
  const url = await createMembershipCheckoutUrl({
    user,
    customerId: record?.app_metadata?.stripe_customer_id,
    site: siteOrigin(request.headers),
  });
  return NextResponse.redirect(url || KEEP_TRAINING_URL, 303);
}
