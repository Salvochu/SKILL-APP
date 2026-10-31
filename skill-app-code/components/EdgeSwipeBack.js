"use client";

import { useEffect, useRef } from "react";

// Where a back swipe can begin: this close to the left edge.
const EDGE_PX = 24;
// Let go past this share of the screen width, or flick faster than
// FLICK_PX_PER_MS, and it counts as "back".
const COMMIT_SHARE = 0.35;
const FLICK_PX_PER_MS = 0.45;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// iOS-style swipe from the left edge to go back, for the installed
// (home screen) app on iPhone, which has no back gesture of its own.
// Safari in a browser tab and Android already go back on an edge swipe,
// so this stays off there rather than fighting the system gesture.
//
// The screen (targetRef) follows the finger 1:1. Letting go past about a
// third of the way, or with a flick, slides it off and calls onBack;
// anything less springs it home. A round chevron fades in at the edge as
// the swipe nears the point where it will commit.
export default function EdgeSwipeBack({ targetRef, onBack, enabled = true }) {
  const onBackRef = useRef(onBack);
  const chipRef = useRef(null);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!enabled || window.navigator.standalone !== true) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let g = null;
    let resetTimer = null;
    // The screen sliding right would otherwise make the page wider than
    // the phone for the length of the swipe, which iOS lets you pan.
    const clipPage = (on) => {
      document.documentElement.style.overflowX = on ? "clip" : "";
    };

    function paint(dx, width) {
      const el = targetRef.current;
      const chip = chipRef.current;
      if (el) el.style.transform = dx ? `translate3d(${dx}px,0,0)` : "";
      if (chip) {
        const p = Math.min(1, dx / (width * COMMIT_SHARE));
        chip.style.opacity = String(p);
        chip.style.transform = `translate3d(${Math.min(dx, 72) * 0.35}px,-50%,0) scale(${0.7 + p * 0.3})`;
        chip.dataset.ready = p >= 1 ? "true" : "false";
      }
    }

    function settle(transitionMs) {
      const el = targetRef.current;
      const chip = chipRef.current;
      for (const node of [el, chip]) {
        if (node) node.style.transition = reduceMotion ? "none" : `transform ${transitionMs}ms ${EASE}, opacity ${transitionMs}ms ease`;
      }
    }

    function onStart(e) {
      if (e.touches.length !== 1 || !targetRef.current) return;
      const t = e.touches[0];
      if (t.clientX > EDGE_PX) return;
      g = { x0: t.clientX, y0: t.clientY, dx: 0, active: false, hist: [{ x: t.clientX, t: e.timeStamp }] };
    }

    function onMove(e) {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (!g.active) {
        // A mostly vertical drag is a scroll: let it be one.
        if (Math.abs(dy) > 10 && Math.abs(dy) > dx) {
          g = null;
          return;
        }
        if (dx < 10) return;
        g.active = true;
        clearTimeout(resetTimer);
        clipPage(true);
        const el = targetRef.current;
        el.style.transition = "none";
        el.style.willChange = "transform";
        el.style.boxShadow = "-16px 0 32px -12px rgba(0,0,0,0.45)";
        if (chipRef.current) chipRef.current.style.transition = "none";
      }
      e.preventDefault();
      g.dx = Math.max(0, dx);
      g.hist.push({ x: t.clientX, t: e.timeStamp });
      if (g.hist.length > 5) g.hist.shift();
      paint(g.dx, window.innerWidth);
    }

    function onEnd() {
      const s = g;
      g = null;
      if (!s?.active) return;
      const first = s.hist[0];
      const last = s.hist[s.hist.length - 1];
      const velocity = (last.x - first.x) / Math.max(1, last.t - first.t);
      const width = window.innerWidth;
      const commit = s.dx > width * COMMIT_SHARE || (velocity > FLICK_PX_PER_MS && s.dx > 32);
      const el = targetRef.current;

      if (commit) {
        settle(220);
        paint(width, width);
        if (chipRef.current) chipRef.current.style.opacity = "0";
        setTimeout(() => onBackRef.current?.(), reduceMotion ? 0 : 180);
        // If the screen is somehow still here (the navigation was
        // cancelled), bring it back rather than leave it off to the side.
        resetTimer = setTimeout(() => {
          settle(320);
          paint(0, width);
          if (el) el.style.boxShadow = "";
          clipPage(false);
        }, 1500);
      } else {
        settle(320);
        paint(0, width);
        setTimeout(() => {
          if (el) {
            el.style.boxShadow = "";
            el.style.willChange = "";
          }
          clipPage(false);
        }, 330);
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    // Next keeps a screen it navigates away from (hidden) for a quick
    // return, so a screen swiped off to the side has to be put back in
    // place as it goes, or a return would find it still off-screen.
    const target = targetRef.current;
    const chip = chipRef.current;
    return () => {
      clearTimeout(resetTimer);
      clipPage(false);
      if (target) {
        target.style.transition = "";
        target.style.transform = "";
        target.style.boxShadow = "";
        target.style.willChange = "";
      }
      if (chip) chip.style.opacity = "0";
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, targetRef]);

  if (!enabled) return null;
  return (
    <span
      ref={chipRef}
      aria-hidden="true"
      style={{ opacity: 0, transform: "translate3d(0,-50%,0) scale(0.7)" }}
      className="glass pointer-events-none fixed left-2 top-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors data-[ready=true]:bg-accent data-[ready=true]:text-black"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
    </span>
  );
}
