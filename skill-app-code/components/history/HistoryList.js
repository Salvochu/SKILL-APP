"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TapLink from "@/components/TapLink";
import LoggedAt from "@/components/LoggedAt";
import { deleteAllWorkouts } from "@/app/(app)/workouts/actions";

// Every logged workout, grouped by training week, with a type-to-confirm
// "delete all" at the bottom. Used raw on the /history page and inside
// the dashboard's popup (WorkoutHistoryModal). `onNavigate` fires when a
// session link is tapped, so the popup can close itself.
export default function HistoryList({ sessions, onNavigate }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  const groups = groupByWeek(sessions);

  async function onClearAll() {
    setClearing(true);
    setError(null);
    const result = await deleteAllWorkouts();
    if (result?.error) {
      setError(result.error);
      setClearing(false);
      return;
    }
    onNavigate?.();
    router.refresh();
  }

  if (groups.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No workouts yet.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-5 overflow-y-auto pb-1">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">{group.label}</h3>
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
              {group.sessions.map((w) => (
                <li key={w.id}>
                  <TapLink
                    href={`/workouts/${w.id}`}
                    onClick={onNavigate}
                    className="flex items-center justify-between gap-3 bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="text-sm font-medium text-fg">{w.title}</span>
                    <span className="shrink-0 text-xs text-dim">
                      <LoggedAt iso={w.started_at} />
                    </span>
                  </TapLink>
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
                onClick={() => {
                  setAsking(false);
                  setConfirmText("");
                  setError(null);
                }}
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
  );
}

// Monday (local) of the week containing d, at 00:00.
function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function groupByWeek(sessions) {
  const thisMon = weekStart(new Date()).getTime();
  const week = 7 * 86400000;
  const groups = new Map();
  for (const s of sessions) {
    const mon = weekStart(new Date(s.started_at));
    const key = mon.getTime();
    if (!groups.has(key)) {
      const diff = Math.round((thisMon - key) / week);
      const label =
        diff === 0
          ? "This week"
          : diff === 1
            ? "Last week"
            : `Week of ${mon.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                ...(mon.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
              })}`;
      groups.set(key, { label, sessions: [] });
    }
    groups.get(key).sessions.push(s);
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v);
}
