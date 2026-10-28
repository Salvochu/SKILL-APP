"use client";

import { useState, useTransition } from "react";
import { CHECKLIST_ITEMS, sessionLabel } from "@/lib/challenge/curriculum";
import { setChecklistItem } from "@/app/(app)/challenge/actions";

// The five daily boxes. Optimistic: the tick flips immediately, the
// server action runs in the background, and a failure rolls it back.
// `locked` (a future day) renders the boxes read-only. `itemsAt` is a
// parallel {key: isoString} map of when each box was last set - shown
// as "ticked X ago" so an auto-tick (logging weight, saving a workout,
// pressing play) never reads as having just happened this second.
export default function ChallengeChecklist({
  day,
  kind,
  items: initial = {},
  itemsAt: initialAt = {},
  locked = false,
  indent = false,
}) {
  // Under a day row in the timeline, line up with the row's text column.
  const padL = indent ? "pl-[60px]" : "pl-4";
  const [items, setItems] = useState(initial);
  const [itemsAt, setItemsAt] = useState(initialAt);
  const [, startTransition] = useTransition();
  const [error, setError] = useState(null);
  // Only the box just tapped gets the little pop, not every ticked box
  // on page load.
  const [popped, setPopped] = useState(null);

  // Something outside this component can also tick a box now (logging
  // weight, saving a workout, pressing play on today's video), each
  // followed by a router.refresh() rather than this component's own
  // optimistic path - so re-sync when the server sends new props.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state from a changed prop: https://react.dev/learn/you-might-not-need-an-effect
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setItems(initial);
    setItemsAt(initialAt);
  }

  function toggle(key) {
    if (locked) return;
    const next = !items[key];
    const prevItems = items;
    const prevAt = itemsAt;
    setItems({ ...items, [key]: next });
    setPopped(next ? key : null);
    setItemsAt({ ...itemsAt, [key]: new Date().toISOString() });
    setError(null);
    startTransition(async () => {
      const res = await setChecklistItem(day, key, next);
      if (res?.error) {
        setItems(prevItems);
        setItemsAt(prevAt);
        setError(res.error);
      } else if (res?.items) {
        setItems(res.items);
        if (res.itemsAt) setItemsAt(res.itemsAt);
      }
    });
  }

  const doneCount = CHECKLIST_ITEMS.filter((i) => items[i.key]).length;
  const allDone = doneCount === CHECKLIST_ITEMS.length;
  const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="flex flex-col">
      <div className={`flex items-center justify-between gap-3 pb-2.5 pr-4 pt-4 ${padL}`}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
          Daily checklist
        </span>
        <span className={`text-[13px] font-semibold tabular-nums ${allDone ? "text-accent" : "text-muted"}`}>
          {allDone ? "Day complete" : `${doneCount} of ${CHECKLIST_ITEMS.length}`}
        </span>
      </div>
      <div className={`pb-2 pr-4 ${padL}`}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
          <div
            className="progress-stripes h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col [&>:first-child_.check-sep]:border-transparent">
        {CHECKLIST_ITEMS.map((item) => {
          const on = Boolean(items[item.key]);
          const label = item.key === "session" ? sessionLabel(kind) : item.label;
          const ago = on ? timeAgo(itemsAt[item.key]) : null;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                disabled={locked}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 text-left transition-colors disabled:cursor-default enabled:hover:bg-surface-2 enabled:active:bg-surface-2 ${padL}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    on ? `bg-accent ${popped === item.key ? "check-pop" : ""}` : "border-2 border-fg/25"
                  }`}
                >
                  {on ? (
                    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5 5 9l4.5-5.5" />
                    </svg>
                  ) : null}
                </span>
                <span className="check-sep flex min-w-0 flex-1 items-baseline justify-between gap-3 border-t border-border/70 py-3.5 pr-4">
                  <span className={`min-w-0 text-[16px] ${on ? "text-fg" : "text-muted"}`}>{label}</span>
                  {ago ? <span className="shrink-0 text-[13px] text-dim">{ago}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className={`border-t border-border/70 py-2.5 pr-4 text-[14px] text-danger ${padL}`}>{error}</p>
      ) : null}
    </div>
  );
}

// Fine-grained near term (a tick usually happens within the same day),
// falling back to day/week for a backfilled past day ticked much later.
function timeAgo(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0 || ms < 60000) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}
