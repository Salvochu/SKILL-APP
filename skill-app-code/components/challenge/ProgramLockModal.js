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
      <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-2 rounded-3xl p-5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          {c.eyebrow}
        </span>
        <h3 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">{c.title}</h3>
        <p className="text-[15px] leading-relaxed text-muted">{c.body}</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <a
            href={KEEP_TRAINING_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-shine flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
          >
            Continue for &pound;7.99/mo
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-fg/10 px-4 py-3.5 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98]"
          >
            {c.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
