"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [60, 90, 120];

// When the rest is over and the app is in the background, fire a local
// notification through the service worker (no server round trip). Gated
// by the "rest timer done" toggle, mirrored to localStorage.
function notifyRestDone() {
  try {
    if (localStorage.getItem("notif:restTimerDone") !== "on") return;
    if (document.visibilityState === "visible") return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    navigator.serviceWorker?.ready?.then((reg) => {
      reg.showNotification("Rest over", {
        body: "Time for your next set.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "rest-timer",
        data: { url: "/log" },
      });
    });
  } catch {
    // best effort
  }
}

// Rest timer. Mounts when a set is logged and, while it runs, takes over
// the top bar (the header's slot, like the Dynamic Island expanding):
// glanceable while you scroll, covering nothing on the page, and clear of
// the thumb zone at the bottom (tab bar, workout pill). One line holds the
// time, -15 / +15 and Skip; tapping the time drops down the presets plus
// pause and restart. Turns red and pulses when the rest is over, and the
// normal header comes back once it's dismissed.
export default function RestTimer({ startSeconds, onDismiss }) {
  const [total, setTotal] = useState(startSeconds);
  const [remaining, setRemaining] = useState(startSeconds);
  const [running, setRunning] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const buzzed = useRef(false);

  // The parent remounts this component (via key) to start a fresh rest, so
  // the useState initializers above are the reset.

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running && !buzzed.current) {
      buzzed.current = true;
      setRunning(false);
      try {
        navigator.vibrate?.(200);
      } catch {
        /* not supported */
      }
      notifyRestDone();
    }
  }, [remaining, running]);

  const mm = String(Math.floor(remaining / 60));
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const done = remaining === 0;

  function restart(seconds = total) {
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(true);
    buzzed.current = false;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[45]">
      <div role="timer" aria-label="Rest timer" className="glass-bar slide-down relative">
        {done ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-alert/10" /> : null}
        <div className="relative mx-auto flex h-14 w-full max-w-2xl items-center gap-1.5 px-4 md:h-16 md:max-w-5xl md:px-6">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide rest timer options" : "Show rest timer options"}
            className="-ml-1 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5 text-left transition-opacity active:opacity-60"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                done ? "bg-alert/15 text-alert" : "bg-accent-soft text-accent"
              }`}
            >
              <IconTimer className="h-[18px] w-[18px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className={`text-[11px] font-semibold uppercase leading-none tracking-[0.06em] ${
                  done ? "text-alert" : "text-muted"
                }`}
              >
                {done ? "Rest over" : running ? "Rest" : "Paused"}
              </span>
              <span
                className={`mt-1 text-[22px] font-bold leading-none tabular-nums tracking-[-0.01em] ${
                  done ? "blink-alert text-alert" : "text-fg"
                }`}
              >
                {mm}:{ss}
              </span>
            </span>
            <IconChevron className={`h-4 w-4 shrink-0 text-dim transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`} />
          </button>
          {!done ? (
            <>
              <TimerButton label="Subtract 15 seconds" onClick={() => setRemaining((r) => Math.max(0, r - 15))}>
                −15
              </TimerButton>
              <TimerButton label="Add 15 seconds" onClick={() => setRemaining((r) => r + 15)}>
                +15
              </TimerButton>
            </>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="ml-0.5 h-9 rounded-full bg-fg px-4 text-[14px] font-semibold text-bg transition-transform active:scale-95"
          >
            {done ? "Done" : "Skip"}
          </button>
        </div>

        {/* Time left, as a thin line along the bar's bottom edge. */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-fg/10">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${done ? "bg-alert" : "bg-accent"}`}
            style={{ width: done ? "100%" : `${pct}%` }}
          />
        </div>
      </div>

      {expanded ? (
        <div className="glass-bar pop-in">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2 md:max-w-5xl md:px-6">
            <div role="radiogroup" aria-label="Rest length" className="flex flex-1 rounded-[10px] bg-fg/10 p-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={total === p}
                  onClick={() => restart(p)}
                  className={`flex-1 rounded-[8px] py-1.5 text-[13px] font-semibold tabular-nums transition-colors ${
                    total === p ? "bg-fg text-bg shadow-sm" : "text-muted"
                  }`}
                >
                  {p}s
                </button>
              ))}
            </div>
            {!done ? (
              <TimerIcon label={running ? "Pause timer" : "Resume timer"} onClick={() => setRunning((v) => !v)}>
                {running ? <IconPause /> : <IconPlay />}
              </TimerIcon>
            ) : null}
            <TimerIcon label="Restart timer" onClick={() => restart()}>
              <IconRestart />
            </TimerIcon>
          </div>
        </div>
      ) : null}

      {done ? (
        <span className="sr-only" role="status" aria-live="assertive">
          Rest over. Time for your next set.
        </span>
      ) : null}
    </div>
  );
}

function TimerButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-9 rounded-full bg-fg/10 px-3 text-[13px] font-semibold tabular-nums text-fg transition-transform active:scale-95"
    >
      {children}
    </button>
  );
}
function TimerIcon({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-[background-color,color,transform] hover:bg-fg/10 hover:text-fg active:scale-90">
      {children}
    </button>
  );
}
function IconPause() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>;
}
function IconPlay() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
}
function IconRestart() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>;
}
function IconTimer(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9.5 2.5h5" />
    </svg>
  );
}
function IconChevron({ className = "" }) {
  return <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>;
}
