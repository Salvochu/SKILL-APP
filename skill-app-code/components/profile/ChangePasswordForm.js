"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowButton } from "@/components/ui/Grouped";

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

  // A row that expands in place (like an iOS disclosure row), so the
  // password fields only show when someone actually wants them.
  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className={`${rowButton} cursor-pointer list-none text-fg`}>
        Change password
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </summary>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 px-4 pb-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          placeholder="New password (8+ characters)"
          aria-label="New password"
          className="w-full rounded-xl bg-surface-2 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/50"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          placeholder="Confirm new password"
          aria-label="Confirm new password"
          className="w-full rounded-xl bg-surface-2 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/50"
        />
        {error ? <p className="text-[14px] text-danger">{error}</p> : null}
        {saved ? <p className="text-[14px] text-good">Password updated.</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-fg px-4 py-3 text-[15px] font-semibold text-bg transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Updating..." : "Update password"}
        </button>
      </form>
    </details>
  );
}
