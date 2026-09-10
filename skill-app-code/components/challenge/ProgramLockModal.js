"use client";

import { KEEP_TRAINING_URL } from "@/lib/links";

// Shown when someone reaches for a paid feature (starting or logging
// another program): a challenge user mid-14-days, or a member whose
// subscription has lapsed. Not a punishment - it only gates what comes
// next, and progress is saved either way.
const COPY = {
  challenge: {
    eyebrow: "Part of a SKILL membership",
    title: "Finish your free 14 days first",
    body: "The full training library unlocks when you continue with a membership. Your challenge stays free and your progress is saved either way.",
    dismiss: "Keep doing the challenge",
  },
  lapsed: {
    eyebrow: "Your membership is paused",
    title: "Resubscribe to start a program",
    body: "Your history, level and saved workouts are all still here. Pick up where you left off the moment you resubscribe.",
    dismiss: "Not now",
  },
};

export default function ProgramLockModal({ onClose, mode = "challenge" }) {
  const c = COPY[mode] ?? COPY.challenge;
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
          {c.eyebrow}
        </span>
        <h3 className="font-display text-lg font-semibold text-fg">{c.title}</h3>
        <p className="text-sm text-muted">{c.body}</p>
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
            {c.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
