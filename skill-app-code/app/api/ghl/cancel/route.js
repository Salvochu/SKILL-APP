import {
  jsonResponse as json,
  verifyGhlSignature,
  extractContact,
} from "@/lib/ghl/webhook";
import { lapseMembershipByEmail } from "@/lib/membership";

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

  try {
    const result = await lapseMembershipByEmail(email);
    return json({ ...result, email });
  } catch (err) {
    console.error("ghl/cancel failed:", err?.message);
    return json({ error: "could not update membership" }, 502);
  }
}

export function GET() {
  return json({ ok: true, endpoint: "ghl cancel webhook", method: "POST only" });
}
