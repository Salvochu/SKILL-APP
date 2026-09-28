"use client";

import { useEffect, useId, useState } from "react";

const TIP_KEY = "skill:flame-tip-seen";
// Streak length at which the flame is fully "hot" - the challenge is
// only 14 days, so a full week felt like the right milestone rather than
// stretching the scale across the whole thing.
const MAX_HEAT_STREAK = 7;

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function lerpChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Linear color interpolation between two hex colors - used instead of a
// fixed set of tiers so the flame warms up gradually rather than jumping
// between a handful of hardcoded looks.
function lerpHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = lerpChannel((a >> 16) & 255, (b >> 16) & 255, t);
  const g = lerpChannel((a >> 8) & 255, (b >> 8) & 255, t);
  const bl = lerpChannel(a & 255, b & 255, t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

// The streak pill on the Main Character Challenge card (ChallengeClimb.js).
// A small flame, unlit at streak 0 - using the same dark palette as the
// trail's own "missed day" nodes - that warms up in color, size and glow
// as the streak grows, capping out at MAX_HEAT_STREAK. Two layered flame
// shapes flicker independently via CSS (.flame-outer/.flame-inner in
// globals.css); only their colors/size/glow are computed here per render,
// since the flicker motion itself doesn't depend on the streak value.
export default function StreakFlame({ streak }) {
  const uid = useId();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    function check() {
      try {
        if (localStorage.getItem(TIP_KEY) !== "1") setShowTip(true);
      } catch {
        setShowTip(true);
      }
    }
    check();
  }, []);

  function dismissTip() {
    setShowTip(false);
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {}
  }

  const heat = clamp01(streak / MAX_HEAT_STREAK);
  const outerBase = lerpHex("#2b2016", "#c85a02", heat);
  const outerTip = lerpHex("#4a382a", "#ffb454", heat);
  const innerBase = lerpHex("#3a2c1e", "#fc7605", heat);
  const innerTip = lerpHex("#4a382a", "#ffd9a8", heat);
  const glow = lerpHex("#2b2016", "#fc7605", heat);
  const scale = 0.92 + heat * 0.22;
  const glowBlur = 1 + heat * 5;

  return (
    <div className="relative">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 shrink-0"
          style={{ transform: `scale(${scale})`, filter: `drop-shadow(0 0 ${glowBlur}px ${glow})` }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-outer`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={outerBase} />
              <stop offset="1" stopColor={outerTip} />
            </linearGradient>
            <linearGradient id={`${uid}-inner`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={innerBase} />
              <stop offset="1" stopColor={innerTip} />
            </linearGradient>
          </defs>
          <path
            className="flame-outer"
            fill={`url(#${uid}-outer)`}
            d="M12 2c1 3-1 5-2.5 6.5C8 10 7 11.5 7 14a5 5 0 0 0 10 0c0-2-1-3.5-2-5 .5 1.5 0 3-1 3.5.5-2-1-4-2-5.5C10 9 11 6 12 2z"
          />
          <path
            className="flame-inner"
            fill={`url(#${uid}-inner)`}
            d="M12 9c.6 1.6-.4 2.6-.9 3.4-.4.7-.6 1.3-.6 2a1.9 1.9 0 0 0 3.8 0c0-.7-.3-1.3-.7-1.9.2.6 0 1.1-.4 1.3.2-.9-.3-1.7-.7-2.4C13.1 10.7 12.4 9.8 12 9z"
          />
        </svg>
        {streak} day{streak === 1 ? "" : "s"}
      </span>

      {showTip ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-field border border-accent/40 bg-surface p-2.5 text-[11px] leading-snug text-fg shadow-xl">
          <button
            type="button"
            onClick={dismissTip}
            aria-label="Dismiss"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-dim transition-colors hover:text-fg"
          >
            <IconClose className="h-2.5 w-2.5" />
          </button>
          Gets more intense the longer your streak runs.
        </div>
      ) : null}
    </div>
  );
}

function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
