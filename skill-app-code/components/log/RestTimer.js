"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [60, 90, 120];

// Floating rest timer. Mounts when a set is logged; counts down and can be
// paused, restarted, nudged by 15s, skipped or dismissed.
export default function RestTimer({ startSeconds, onDismiss }) {
  const [total, setTotal] = useState(startSeconds);
  const [remaining, setRemaining] = useState(startSeconds);
  const [running, setRunning] = useState(true);
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
    }
  }, [remaining, running]);

  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg px-4 md:bottom-6">
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lg shadow-black/40">
        <div className="h-1 bg-border">
          <div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 p-3">
          <span className="tabular text-xl font-bold text-fg">
            {mm}:{ss}
          </span>
          <div className="flex items-center gap-1">
            <TimerButton label="Subtract 15 seconds" onClick={() => setRemaining((r) => Math.max(0, r - 15))}>
              -15
            </TimerButton>
            <TimerButton label="Add 15 seconds" onClick={() => setRemaining((r) => r + 15)}>
              +15
            </TimerButton>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <TimerIcon label={running ? "Pause timer" : "Resume timer"} onClick={() => setRunning((v) => !v)}>
              {running ? <IconPause /> : <IconPlay />}
            </TimerIcon>
            <TimerIcon label="Restart timer" onClick={() => { setRemaining(total); setRunning(true); buzzed.current = false; }}>
              <IconRestart />
            </TimerIcon>
            <TimerIcon label="Dismiss timer" onClick={onDismiss}>
              <IconX />
            </TimerIcon>
          </div>
        </div>
        <div className="flex gap-1.5 px-3 pb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setTotal(p); setRemaining(p); setRunning(true); buzzed.current = false; }}
              className={`rounded-field px-2.5 py-1 text-xs font-medium transition-colors ${
                total === p ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"
              }`}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimerButton({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="tabular rounded-field bg-surface-2 px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-fg">
      {children}
    </button>
  );
}
function TimerIcon({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="rounded-field p-1.5 text-muted transition-colors hover:text-fg">
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
function IconX() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
}
