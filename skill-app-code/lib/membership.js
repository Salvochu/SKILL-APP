import { createAdminClient } from "@/lib/supabase/admin";
import { findUserByEmail } from "@/lib/supabase/selectAll";

// Flips a paid member to "lapsed" by email. Shared by both cancellation
// paths - GHL's own workflow webhook (/api/ghl/cancel) and Stripe's
// native subscription.deleted webhook (/api/stripe/subscription-canceled)
// - since they can both end up telling us the same thing happened.
//
// Never touches 'coach', 'challenge', a NULL (grandfathered) profile, or
// an account that is already 'lapsed' - only an active paid member can
// lapse.
export async function lapseMembershipByEmail(email) {
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

  return { ok: true, membership: "lapsed" };
}
