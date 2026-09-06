"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchExerciseHistory } from "@/app/(app)/log/history-actions";
import { shortDate } from "@/components/progress/chartkit";

// Popup listing the last few sessions for one exercise. Opened from the
// "last time" line in the logger; loads on open. A link takes you to the
// full per-exercise history page.
export default function LastNumbers({ exerciseId, exerciseName, onClose }) {
  const [state, setState] = useState({ loading: true, sessions: [], count: 0, unit: "kg" });

  useEffect(() => {
    let alive = true;
    fetchExerciseHistory(exerciseId, 5)
      .then((res) => alive && setState({ loading: false, ...res }))
      .catch(() => alive && setState((s) => ({ ...s, loading: false })));
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
    };
  }, [exerciseId, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`${exerciseName} history`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-surface sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-bold text-fg">{exerciseName}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {state.loading ? (
            <p className="py-6 text-center text-sm text-dim">Loading...</p>
          ) : state.sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No history for this exercise yet.</p>
          ) : (
            state.sessions.map((s) => (
              <div key={s.id} className="flex flex-col gap-1 rounded-field border border-border bg-bg/40 p-3">
                <span className="text-xs font-semibold text-dim">{shortDate(s.date)}</span>
                <span className="tabular text-sm text-fg">
                  {s.sets
                    .map((x) => `${x.weight ?? "-"}${state.unit} x ${x.reps ?? "-"}${x.rir != null ? ` @${x.rir}` : ""}`)
                    .join("   .   ")}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4">
          <Link
            href={`/library/exercises/${exerciseId}`}
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-field border border-border px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2 active:bg-accent-soft"
          >
            See full history{state.count > 5 ? ` (${state.count} sessions)` : ""}
          </Link>
        </div>
      </div>
    </div>
  );
}
