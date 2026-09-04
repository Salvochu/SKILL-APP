"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    // We ignore the result on purpose: the confirmation copy is the same
    // whether or not the address has an account, so it can't be used to
    // probe which emails are registered.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/auth/set-password")}`,
    });
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-field border border-border bg-surface px-3 py-2.5 text-sm text-muted">
          If <span className="text-fg">{email}</span> has an account, a link to set a new
          password is on its way. Check your inbox and spam.
        </p>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          className="rounded-field border border-border bg-surface px-3 py-2 text-fg placeholder:text-dim focus:border-accent"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send reset link"}
      </button>
      <Link href="/login" className="text-sm text-muted hover:text-fg">
        Back to sign in
      </Link>
    </form>
  );
}
