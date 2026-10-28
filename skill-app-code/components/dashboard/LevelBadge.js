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
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Your level"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <span
            className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[20px] font-bold"
            style={{ backgroundColor: `${tierColor}26`, color: tierColor }}
          >
            {level}
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">
              Level {level}
            </h2>
            <span className="text-[14px] font-semibold" style={{ color: tierColor }}>
              {tier} rank
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${pctToNextLevel}%`, backgroundColor: tierColor }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
            <span className="tabular font-semibold text-fg">{xp.toLocaleString()} XP</span>
            <span>
              {atMax ? "Max level" : `${xpToNextLevel.toLocaleString()} XP to Level ${level + 1}`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-snug text-muted">
            XP comes from training consistently, and it never goes down.
          </p>
          {earned.length > 0 ? (
            <ul className="flex flex-col overflow-hidden rounded-2xl bg-fg/[0.06] [&>*+*]:border-t [&>*+*]:border-fg/10">
              {earned.map((b) => (
                <li key={b.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
                  <span className="min-w-0 text-fg">{b.label}</span>
                  <span className="tabular shrink-0 text-muted">
                    <span className="font-semibold text-fg">×{b.count}</span> · {b.xp.toLocaleString()} XP
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {nextTier ? (
          <p className="text-[13px] text-muted">
            Reach Level {nextTier.min} for{" "}
            <span className="font-semibold" style={{ color: nextTier.color }}>
              {nextTier.name}
            </span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
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
        className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold transition-[opacity,transform] hover:opacity-85 active:scale-95"
        style={{ color: tierColor, backgroundColor: `${tierColor}24` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
        {compact ? tier : `${tier} · Lvl ${level}`}
      </button>
      {open && mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
