"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// The Journey level as a material-coloured badge. Tapping it opens a
// short explainer: the XP total, how far to the next level, and exactly
// where the XP came from. Portalled to <body> so a backdrop-blurred
// ancestor can't trap the dialog.
export default function LevelBadge({ journey, compact = false }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function ready() {
      setMounted(true);
    }
    ready();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!journey) return null;

  const { tier, tierColor, level, xp, atMax, xpToNextLevel, pctToNextLevel, nextTier } = journey;
  const earned = (journey.breakdown ?? []).filter((b) => b.count > 0);

  const dialog = (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-16"
      role="dialog"
      aria-modal="true"
      aria-label="Your level"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-xs rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <span
            className="tabular flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: `${tierColor}22`, color: tierColor }}
          >
            {level}
          </span>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-fg">Level {level}</h2>
            <span className="text-xs font-semibold" style={{ color: tierColor }}>
              {tier} rank
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${pctToNextLevel}%`, backgroundColor: tierColor }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-dim">
            <span className="tabular">{xp.toLocaleString()} XP</span>
            <span>
              {atMax ? "Max level" : `${xpToNextLevel.toLocaleString()} XP to Level ${level + 1}`}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          XP comes from training consistently, and it never goes down.
        </p>

        {earned.length > 0 ? (
          <ul className="mt-2 flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
            {earned.map((b) => (
              <li
                key={b.key}
                className="flex items-center justify-between gap-3 bg-bg/40 px-3 py-2 text-xs"
              >
                <span className="text-muted">{b.label}</span>
                <span className="tabular shrink-0 text-dim">
                  <span className="text-fg">×{b.count}</span> · {b.xp.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {nextTier ? (
          <p className="mt-3 text-xs text-dim">
            Reach Level {nextTier.min} for{" "}
            <span className="font-semibold" style={{ color: nextTier.color }}>
              {nextTier.name}
            </span>
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
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Level ${level}, ${tier} rank. See how it works`}
        className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ color: tierColor, borderColor: `${tierColor}66`, backgroundColor: `${tierColor}12` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
        {compact ? tier : `${tier} · Lvl ${level}`}
      </button>
      {open && mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
