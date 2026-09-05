"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoggedAt from "@/components/LoggedAt";
import { deleteAllWorkouts } from "@/app/(app)/workouts/actions";

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
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onClearAll() {
    setClearing(true);
    setError(null);
    const result = await deleteAllWorkouts();
    if (result?.error) {
      setError(result.error);
      setClearing(false);
      return;
    }
    onClose();
    router.refresh();
  }

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
          <>
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
                          <span className="shrink-0 text-xs text-dim">
                            <LoggedAt iso={w.started_at} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-4 shrink-0 border-t border-border pt-4">
              {asking ? (
                <div className="flex flex-col gap-2 rounded-card border border-danger/30 bg-danger/5 p-3">
                  <p className="text-sm text-muted">
                    Delete all {sessions.length} workouts? This cannot be undone. Type{" "}
                    <span className="font-semibold text-fg">DELETE</span> to confirm.
                  </p>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-danger"
                  />
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setAsking(false); setConfirmText(""); setError(null); }}
                      disabled={clearing}
                      className="flex-1 rounded-field border border-border px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onClearAll}
                      disabled={confirmText !== "DELETE" || clearing}
                      className="flex-1 rounded-field bg-danger px-3 py-2 text-sm font-semibold text-black transition-colors disabled:opacity-40"
                    >
                      {clearing ? "Deleting..." : "Delete all"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsking(true)}
                  className="rounded-field px-1 text-sm font-medium text-danger hover:underline"
                >
                  Delete all history
                </button>
              )}
            </div>
          </>
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
