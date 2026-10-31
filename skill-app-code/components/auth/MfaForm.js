"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Checks the authenticator code against the account's two-factor and,
// when it matches, upgrades this session (aal2) and carries on to `next`.
export default function MfaForm({ next }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Enter the 6 digits from your authenticator app.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.[0];
    if (listError || !factor) {
      setPending(false);
      setError("Your sign-in has expired. Sign out and sign in again.");
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: clean,
    });
    if (verifyError) {
      setPending(false);
      setCode("");
      setError("That code didn't work. Codes change every 30 seconds, so try the one on screen now.");
      return;
    }
    // A full page load, so the server reads the upgraded session.
    window.location.replace(next);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[14px] text-danger">{error}</p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        6-digit code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123 456"
          className="auth-input text-center text-[22px] tabular-nums tracking-[0.3em]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-shine mt-1 rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
