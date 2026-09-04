"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
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
          className="rounded-field border border-border bg-surface px-3 py-2 text-fg placeholder:text-dim focus:border-accent"
        />
        <span className="text-xs font-normal text-dim">At least 8 characters.</span>
      </label>

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {status === "saving" ? "Saving..." : "Set password and sign in"}
      </button>

      <Link href="/login" className="text-sm text-muted hover:text-fg">
        Back to sign in
      </Link>
    </form>
  );
}
