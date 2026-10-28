"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sheet from "@/components/Sheet";
import { fetchExerciseHistory } from "@/app/(app)/log/history-actions";
import { shortDate } from "@/components/progress/chartkit";

// Sheet listing the last few sessions for one exercise. Opened from the
// "last time" line in the logger; loads on open. A link takes you to the
// full per-exercise history page.
export default function LastNumbers({ exerciseId, exerciseName, unit = "kg", onClose }) {
  const [state, setState] = useState({ loading: true, sessions: [], count: 0, unit });

  useEffect(() => {
    let alive = true;
    fetchExerciseHistory(exerciseId, 5, unit)
      .then((res) => alive && setState({ loading: false, ...res }))
      .catch(() => alive && setState((s) => ({ ...s, loading: false })));
    return () => {
      alive = false;
    };
  }, [exerciseId, unit]);

  return (
    <Sheet onClose={onClose} ariaLabel={`${exerciseName} history`}>
      {(close) => (
        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Last sessions</span>
              <h2 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                {exerciseName}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto px-4">
            {state.loading ? (
              <div className="flex flex-col gap-2 py-6">
                <div className="loading-bar h-1 w-full rounded-full bg-fg/10" />
                <p className="text-center text-[13px] text-muted">Loading history</p>
              </div>
            ) : state.sessions.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-muted">No history for this exercise yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-fg/[0.06] [&>*+*]:border-t [&>*+*]:border-fg/10">
                {state.sessions.map((s) => (
                  <div key={s.id} className="flex flex-col gap-2 px-4 py-3">
                    <span className="text-[13px] font-semibold text-muted">{shortDate(s.date)}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {s.sets.map((x, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-fg/10 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-fg"
                        >
                          {x.weight ?? "-"} {state.unit} x {x.reps ?? "-"}
                          {x.rir != null ? <span className="font-medium text-muted"> @{x.rir}</span> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            <Link
              href={`/library/exercises/${exerciseId}`}
              onClick={close}
              className="flex w-full items-center justify-center rounded-2xl bg-fg/10 px-4 py-3.5 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98]"
            >
              See full history{state.count > 5 ? ` (${state.count} sessions)` : ""}
            </Link>
          </div>
        </div>
      )}
    </Sheet>
  );
}
