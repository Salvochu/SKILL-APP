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
        <p className="rounded-field border border-border bg-black/30 px-3 py-2.5 text-sm text-muted">
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
          className="auth-input"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-shine rounded-field bg-accent px-4 py-3 font-bold text-black shadow-[0_10px_30px_-10px_rgba(252,118,5,0.7)] transition-transform active:scale-[0.99] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send reset link"}
      </button>
      <Link href="/login" className="text-center text-sm text-muted hover:text-fg">
        Back to sign in
      </Link>
    </form>
  );
}
