"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setSaved(true);
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Change password</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          />
          <span className="text-xs font-normal text-dim">At least 8 characters.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          />
        </label>

        {error ? (
          <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {saved ? (
          <p className="rounded-field border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent">
            Password updated.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          {saving ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}
