"use client";

import { useEffect, useState } from "react";
import HistoryList from "@/components/history/HistoryList";

// Full workout history in a popup, behind a "show all" trigger. The
// trigger is passed as `children` (e.g. a plain <button>) so the same
// popup can sit behind a dashboard button or a menu row. Wrapped in a
// span rather than cloned: the callers are Server Components, so
// children arrives already rendered. The list itself is shared with the
// standalone /history page (components/history/HistoryList).
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Workout history"
    >
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
        <HistoryList sessions={sessions} onNavigate={onClose} />
      </div>
    </div>
  );
}
