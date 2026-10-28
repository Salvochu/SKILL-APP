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
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-strong pop-in relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-3xl p-4">
        <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
          <h2 className="font-display text-[1.35rem] font-bold tracking-[-0.02em] text-fg">Workout history</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <HistoryList sessions={sessions} onNavigate={onClose} />
      </div>
    </div>
  );
}
