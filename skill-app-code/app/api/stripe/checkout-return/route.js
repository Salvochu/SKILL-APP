import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/api";
import { activateFromCheckoutSession } from "@/lib/membership";

// Where Stripe sends someone straight after paying. The webhook unlocks
// the account too, but it can land a few seconds later; checking the
// session here means they open the app as a member immediately. Safe to
// hit with any id: only a paid SKILL checkout unlocks anything, and
// only the account that checkout was made for.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const id = searchParams.get("session_id");
  if (id && /^cs_[A-Za-z0-9_]+$/.test(id)) {
    try {
      const session = await stripe("GET", `/checkout/sessions/${id}`);
      await activateFromCheckoutSession(session);
    } catch (err) {
      console.error("checkout-return failed:", err.message);
    }
  }
  return NextResponse.redirect(new URL("/dashboard", origin));
}
