"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// `email` is the account the link signed into, shown so people know
// which account they are setting a password for (and so the phone's
// password manager saves the new password under the right email).
export default function SetPasswordForm({ email = null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      // Two-factor is on for this account: the code comes first.
      if (updateError.code === "insufficient_aal" || /aal2/i.test(updateError.message)) {
        router.push(`/auth/mfa?next=${encodeURIComponent("/auth/set-password")}`);
        return;
      }
      setStatus("error");
      setError(
        /session|jwt|auth/i.test(updateError.message)
          ? "This link has expired. Open the link from your email again."
          : updateError.message,
      );
      return;
    }
    setStatus("done");
    router.replace("/dashboard");
    router.refresh();
  }

  if (status === "done") {
    return <p className="text-sm text-muted">Password set. Taking you to your dashboard.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {email ? (
        <div className="flex flex-col gap-1 rounded-xl bg-fg/[0.04] px-3.5 py-2.5">
          <span className="text-xs font-medium text-dim">Account</span>
          <span className="break-all text-[15px] font-medium text-fg">{email}</span>
          {/* Not shown: lets the password manager file the new password
              under this email. */}
          <input
            type="email"
            name="username"
            value={email}
            readOnly
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
        </div>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        New password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          className="auth-input"
        />
        <span className="text-xs font-normal text-dim">At least 8 characters.</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        Confirm password
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="auth-input"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="btn-shine rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {status === "saving" ? "Saving..." : "Set password and sign in"}
      </button>

      <Link href="/login" className="text-center text-sm text-muted hover:text-fg">
        Back to sign in
      </Link>
    </form>
  );
}
