import { createAdminClient } from "@/lib/supabase/admin";
import { findUserByEmail } from "@/lib/supabase/selectAll";
import { updateGhlTags } from "@/lib/ghl";

// The free challenge's mesocycle template (migration 0033).
const CHALLENGE_TEMPLATE_ID = "main-character-14";

// Flips a paid member to "lapsed" by email. Shared by both cancellation
// paths - GHL's own workflow webhook (/api/ghl/cancel) and Stripe's
// native subscription.deleted webhook (/api/stripe/subscription-canceled)
// - since they can both end up telling us the same thing happened.
//
// Never touches 'coach', 'challenge', a NULL (grandfathered) profile, or
// an account that is already 'lapsed' - only an active paid member can
// lapse.
//
// tagGhl: also tag the GHL contact "skill app lapsed", for a subscription
// that was bought inside the app (GHL never saw that purchase, so its
// own cancellation trigger can't fire for it).
export async function lapseMembershipByEmail(email, { tagGhl = false } = {}) {
  const supabase = createAdminClient();

  // Look up the auth user by email across every page of accounts (a
  // plain listUsers() only sees the first 50).
  const user = await findUserByEmail(supabase, email);
  if (!user) return { ok: true, skipped: "no account" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.membership !== "member") {
    return { ok: true, skipped: `membership is ${profile?.membership ?? "null"}` };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ membership: "lapsed" })
    .eq("user_id", user.id);
  if (updateError) throw new Error(`could not update membership: ${updateError.message}`);

  if (tagGhl) await updateGhlTags(email, { add: ["skill app lapsed"], remove: ["skill app checkout"] });
  return { ok: true, membership: "lapsed" };
}

// A finished Stripe checkout from the app's own "Keep training" button
// (app/(app)/membership/actions.js). Called by both the Stripe webhook
// and the page Stripe returns people to, so it must be safe to run
// twice. Anything else that completes a checkout on the same Stripe
// account (the 1:1 coaching payment link) has no skill_user_id and is
// left alone.
export async function activateFromCheckoutSession(session) {
  const userId = session?.metadata?.skill_user_id;
  if (!userId || session.client_reference_id !== userId) {
    return { ok: true, skipped: "not a SKILL app checkout" };
  }
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (session.mode !== "subscription" || session.status !== "complete" || !paid) {
    return { ok: true, skipped: "checkout not paid" };
  }
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  return activatePaidMembership(userId, { customerId });
}

// Turns an account into a paying member: the profile flag, the challenge
// run closed out (so the dashboard stops showing the Day 14 fork), the
// billing flag that shows them "Manage membership", and the
// "skill app checkout" tag in GHL that starts its welcome workflow.
// Leaves the coach and existing members alone.
export async function activatePaidMembership(userId, { customerId } = {}) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile?.role === "coach") return { ok: true, skipped: "coach" };
  if (profile?.membership === "member") return { ok: true, skipped: "already a member" };

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, membership: "member" }, { onConflict: "user_id" });
  if (error) throw new Error(`could not update membership: ${error.message}`);

  await supabase
    .from("user_mesocycles")
    .update({ status: "completed" })
    .eq("user_id", userId)
    .eq("template_id", CHALLENGE_TEMPLATE_ID)
    .eq("status", "active");

  const { data: updated } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      billing: "stripe",
      membership_ends_at: null,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    },
  });
  await updateGhlTags(updated?.user?.email, { add: ["skill app checkout"], remove: ["skill app lapsed"] });

  return { ok: true, membership: "member" };
}

// A member cancelled (their subscription now ends at the end of the
// paid month) or changed their mind and renewed it. Saves the end date
// on their account, or clears it, so Profile and the dashboard can say
// when access stops and offer to keep it. Only subscriptions started in
// the app carry the user id; others are left alone.
export async function recordMembershipEnd(subscription) {
  const userId = subscription?.metadata?.skill_user_id;
  if (!userId) return { ok: true, skipped: "not started in the app" };

  const ending = Boolean(subscription.cancel_at_period_end || subscription.cancel_at);
  const endsAtSeconds = subscription.cancel_at || subscription.current_period_end;
  const membershipEndsAt = ending && endsAtSeconds ? new Date(endsAtSeconds * 1000).toISOString() : null;

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { membership_ends_at: membershipEndsAt },
  });
  if (error) throw new Error(`could not save the end date: ${error.message}`);
  return { ok: true, membership_ends_at: membershipEndsAt };
}

