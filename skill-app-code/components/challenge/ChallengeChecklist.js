"use client";

import { useState, useTransition } from "react";
import { CHECKLIST_ITEMS, sessionLabel } from "@/lib/challenge/curriculum";
import { setChecklistItem } from "@/app/(app)/challenge/actions";

// The five daily boxes. Optimistic: the tick flips immediately, the
// server action runs in the background, and a failure rolls it back.
// `locked` (a future day) renders the boxes read-only.
export default function ChallengeChecklist({ day, kind, items: initial = {}, locked = false }) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function toggle(key) {
    if (locked) return;
    const next = !items[key];
    const prev = items;
    setItems({ ...items, [key]: next });
    setError(null);
    startTransition(async () => {
      const res = await setChecklistItem(day, key, next);
      if (res?.error) {
        setItems(prev);
        setError(res.error);
      } else if (res?.items) {
        setItems(res.items);
      }
    });
  }

  const doneCount = CHECKLIST_ITEMS.filter((i) => items[i.key]).length;
  const allDone = doneCount === CHECKLIST_ITEMS.length;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-dim">
          Daily checklist
        </span>
        <span
          className={`text-xs font-semibold ${allDone ? "text-accent" : "text-dim"}`}
        >
          {allDone ? "Day complete" : `${doneCount} / ${CHECKLIST_ITEMS.length}`}
        </span>
      </div>
      <ul className="flex flex-col">
        {CHECKLIST_ITEMS.map((item) => {
          const on = Boolean(items[item.key]);
          const label = item.key === "session" ? sessionLabel(kind) : item.label;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                disabled={locked}
                aria-pressed={on}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default enabled:hover:bg-surface-2"
              >
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                    on ? "border-accent bg-accent" : "border-border-strong bg-transparent"
                  }`}
                >
                  {on ? (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6.5 5 9l5-6" />
                    </svg>
                  ) : null}
                </span>
                <span className={on ? "text-fg" : "text-muted"}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="border-t border-border px-4 py-2 text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
