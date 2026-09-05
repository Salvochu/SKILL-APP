"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Full workout history, grouped by month, behind a "show all" trigger.
// The trigger itself is left to the caller as `children` (e.g. a plain
// <button>), so this same modal can sit behind a plain button on the
// dashboard or a menu row. Wrapped rather than cloned with an injected
// onClick: the callers here are Server Components, so children arrives
// as an already-rendered element, and a wrapping span is a simpler way
// to make it clickable than reaching into it.
export default function WorkoutHistoryModal({ sessions, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open ? <HistoryDialog sessions={sessions} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HistoryDialog({ sessions, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = groupByMonth(sessions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Workout history">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface p-4">
        <div className="flex shrink-0 items-center justify-between pb-3">
          <h2 className="font-display text-lg font-semibold text-fg">Workout history</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No workouts yet.</p>
        ) : (
          <div className="flex flex-col gap-5 overflow-y-auto pb-1">
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">{group.label}</h3>
                <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
                  {group.sessions.map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/workouts/${w.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
                      >
                        <span className="text-sm font-medium text-fg">{w.title}</span>
                        <span className="text-xs text-dim">
                          {new Date(w.started_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByMonth(sessions) {
  const groups = new Map();
  for (const s of sessions) {
    const d = new Date(s.started_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        sessions: [],
      });
    }
    groups.get(key).sessions.push(s);
  }
  return [...groups.values()];
}
