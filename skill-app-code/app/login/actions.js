"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

export async function login(formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // The form's hidden "next" field can be edited like anything else the
  // browser sends, so it is checked here too, not only on the page.
  const next = safeNext(String(formData.get("next") ?? ""));
  const retry = (code) =>
    redirect(`/login?error=${code}&next=${encodeURIComponent(next)}`);

  if (!email || !password) retry("missing");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) retry(errorCode(error));

  // Two-factor turned on: the password is only the first step.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/auth/mfa?next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

// Supabase's own message never reaches the page (see ERRORS in page.js).
function errorCode(error) {
  if (error.code === "email_not_confirmed") return "unconfirmed";
  if (error.status === 429) return "rate";
  if (error.status === 400 || error.status === 401 || error.status === 422) return "invalid";
  return "failed";
}
