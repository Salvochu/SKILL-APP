"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/(app)/profile/actions";
import { rowButton } from "@/components/ui/Grouped";

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
    <div>
      <button type="button" onClick={() => setConfirmOpen(true)} className={`${rowButton} text-danger`}>
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
          <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-3 rounded-3xl p-5">
            <h3 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">Delete your account</h3>
            <p className="text-[15px] leading-relaxed text-muted">
              This permanently deletes your login and every workout you have logged. It cannot be
              undone. Type <span className="font-semibold text-fg">DELETE</span> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              aria-label="Type DELETE to confirm"
              className="w-full rounded-xl bg-fg/10 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-danger/60"
            />
            {error ? <p className="text-[14px] text-danger">{error}</p> : null}
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-fg/10 px-4 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 rounded-2xl bg-danger px-4 py-3 text-[15px] font-semibold text-black transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
