"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

// Spends the one-time link (see page.js), sets the session cookie, then
// forwards on. Handles both link styles:
//   - token_hash + type   verified with verifyOtp (works cross device;
//     used by the GHL webhooks, coach invites and a custom email template)
//   - code                exchanged for a session (the default Supabase
//     template with the PKCE flow)
export async function confirmLink(formData) {
  const tokenHash = String(formData.get("token_hash") || "");
  const type = String(formData.get("type") || "");
  const code = String(formData.get("code") || "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    // A recovery link (sign-up welcome emails, coach invites, Forgot
    // password) is only ever for choosing a password, so it always lands
    // on that screen, whatever its next says: email tools can mangle the
    // end of a link (GHL dropped it), which skipped the step.
    if (!error) redirect(type === "recovery" ? "/auth/set-password" : next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  redirect("/login?error=expired");
}
