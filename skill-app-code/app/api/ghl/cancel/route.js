import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonResponse as json,
  verifyGhlSignature,
  extractContact,
} from "@/lib/ghl/webhook";

// GHL calls this when a paid app subscription ends: a voluntary cancel
// (fire this at the end of the paid period, not the moment they click
// cancel) or dunning that has finally given up. It flips the profile
// from 'member' to 'lapsed' - data kept, but the logger and program
// starts are locked until they resubscribe, which the purchase webhook
// turns back into 'member'.
//
// Setup: the same GHL_WEBHOOK_SECRET as /api/ghl/purchase.
//
// Never touches 'coach', 'challenge', a NULL (grandfathered) profile, or
// an account that is already 'lapsed' - only an active paid member can
// lapse.

export async function POST(request) {
  const rawBody = await request.text();

  if (!verifyGhlSignature(rawBody, request)) {
    return json({ error: "signature verification failed" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const { email } = extractContact(payload);
  if (!email) {
    return json({ error: "no email found in payload" }, 422);
  }

  const supabase = createAdminClient();

  // Look up the auth user by email. No pagination needed at this scale;
  // listUsers is the only admin lookup-by-email available.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("ghl/cancel listUsers failed:", listError.message);
    return json({ error: "could not look up account" }, 502);
  }
  const user = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    // Nothing to do - no account for this email. Not an error: GHL may
    // fire for a contact who never finished sign-up.
    return json({ ok: true, email, skipped: "no account" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.membership !== "member") {
    return json({ ok: true, email, skipped: `membership is ${profile?.membership ?? "null"}` });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ membership: "lapsed" })
    .eq("user_id", user.id);
  if (updateError) {
    console.error("ghl/cancel update failed:", updateError.message);
    return json({ error: "could not update membership" }, 502);
  }

  return json({ ok: true, email, membership: "lapsed" });
}

export function GET() {
  return json({ ok: true, endpoint: "ghl cancel webhook", method: "POST only" });
}
