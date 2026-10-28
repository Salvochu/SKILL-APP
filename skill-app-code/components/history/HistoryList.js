"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TapLink from "@/components/TapLink";
import LoggedAt from "@/components/LoggedAt";
import { deleteAllWorkouts } from "@/app/(app)/workouts/actions";
import { shortDate } from "@/components/progress/chartkit";

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
    return <p className="rounded-2xl bg-surface py-10 text-center text-[15px] text-muted">No workouts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h3 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{group.label}</h3>
          <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
            {group.sessions.map((w) => (
              <li key={w.id}>
                <TapLink
                  href={`/workouts/${w.id}`}
                  onClick={onNavigate}
                  className="flex pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3.5 pr-4">
                    <span className="min-w-0 flex-1 truncate text-[16px] text-fg">{w.title}</span>
                    <span className="shrink-0 text-[14px] text-muted">
                      <LoggedAt iso={w.started_at} />
                    </span>
                    <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                  </span>
                </TapLink>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-2">
        {asking ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
            <p className="text-[15px] leading-relaxed text-muted">
              Delete all {sessions.length} workouts? This cannot be undone. Type{" "}
              <span className="font-semibold text-fg">DELETE</span> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              autoFocus
              className="w-full rounded-xl bg-fg/[0.07] px-3.5 py-2.5 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-danger/60"
            />
            {error ? <p className="text-[14px] text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAsking(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={clearing}
                className="flex-1 rounded-xl bg-fg/10 px-3 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onClearAll}
                disabled={confirmText !== "DELETE" || clearing}
                className="flex-1 rounded-xl bg-danger px-3 py-3 text-[15px] font-semibold text-black transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40"
              >
                {clearing ? "Deleting..." : "Delete all"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-left text-[16px] text-danger transition-colors hover:bg-surface-2 active:bg-surface-2"
          >
            Delete all history
          </button>
        )}
      </section>
    </div>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// Monday (local) of the week containing d, at 00:00.
function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function localYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
            : // The app's own date format, not the device locale's, so the
              // server render and the phone agree (and it reads like
              // every other date in the app).
              `Week of ${shortDate(localYmd(mon))}${
                mon.getFullYear() !== new Date().getFullYear() ? ` ${mon.getFullYear()}` : ""
              }`;
      groups.set(key, { label, sessions: [] });
    }
    groups.get(key).sessions.push(s);
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v);
}
