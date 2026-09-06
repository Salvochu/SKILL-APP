"use client";

import { useEffect, useState } from "react";

// The top-bar streak chip. Tapping it opens a short explainer.
export default function StreakChip({ weeks = 0, best = 0 }) {
  const [open, setOpen] = useState(false);
  const active = weeks > 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? `${weeks} week streak. What is this?` : "No current streak. What is this?"}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-colors ${
          active ? "bg-accent text-black" : "bg-surface-2 text-dim hover:text-fg"
        }`}
      >
        <IconFlame className="h-3.5 w-3.5" />
        <span className="tabular">{weeks}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20"
          role="dialog"
          aria-modal="true"
          aria-label="About streaks"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative w-full max-w-xs rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <IconFlame className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-fg">Weekly streak</h2>
            </div>
            <p className="mt-3 text-sm text-muted">
              {active
                ? `You have trained ${weeks} week${weeks === 1 ? "" : "s"} in a row. Log at least one workout each week to keep it going.`
                : "Log a workout this week to start a streak. Then train at least once a week to keep it."}
            </p>
            {best > 0 ? (
              <p className="mt-2 text-xs text-dim">
                Longest streak so far: <span className="tabular font-semibold text-fg">{best}</span>{" "}
                week{best === 1 ? "" : "s"}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function IconFlame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c1 3-1 5-1 7a3 3 0 0 0 6 0c0-1 0-2-.5-3 2 2 3.5 4.5 3.5 7a8 8 0 0 1-16 0c0-4 3-6 4-9 .7-2 3-2 4-2z" />
    </svg>
  );
}
