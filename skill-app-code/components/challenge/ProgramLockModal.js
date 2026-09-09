"use client";

import { KEEP_TRAINING_URL } from "@/lib/links";

// Shown when a challenge user reaches for a paid feature (starting or
// logging another program). Not a punishment: the challenge stays free
// and complete, this only gates what comes after it.
export default function ProgramLockModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Programs are part of a membership"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Part of a SKILL membership
        </span>
        <h3 className="font-display text-lg font-semibold text-fg">
          Finish your free 14 days first
        </h3>
        <p className="text-sm text-muted">
          The full training library unlocks when you continue with a membership.
          Your challenge stays free and your progress is saved either way.
        </p>
        <div className="mt-1 flex flex-col gap-2">
          <a
            href={KEEP_TRAINING_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Continue for &pound;14.99/mo
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Keep doing the challenge
          </button>
        </div>
      </div>
    </div>
  );
}
