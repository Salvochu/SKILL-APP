import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase email links (password recovery, magic link,
// email change). Handles both link styles:
//   - ?token_hash=...&type=...   verified with verifyOtp (works cross
//     device; used by the GHL webhook and a custom email template)
//   - ?code=...                  exchanged for a session (the default
//     Supabase template with the PKCE flow)
// Either way it sets the session cookie, then forwards on.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent("That link has expired. Request a new one.")}`,
      origin,
    ),
  );
}

function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}
