"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions";
import { deleteAccount } from "@/app/(app)/profile/actions";

export default function DangerZone() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function onDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteAccount();
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/login");
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Account</h2>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-field border border-border px-4 py-2.5 text-left text-sm font-medium text-fg hover:bg-surface-2"
        >
          Sign out
        </button>
      </form>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="w-full rounded-field border border-danger/40 px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10"
      >
        Delete account
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Delete account">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => !deleting && setConfirmOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-semibold text-fg">Delete your account</h3>
            <p className="text-sm text-muted">
              This permanently deletes your login and every workout you have logged. It cannot be
              undone. Type <span className="font-semibold text-fg">DELETE</span> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-danger"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 rounded-field bg-danger px-4 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
