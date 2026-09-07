"use client";

import { useState } from "react";
import { weekLayout, cleanFocus } from "@/lib/splitWeek";

// An example training week for a split: seven weekday squares, training
// days in light orange, rest days plain. Tap a square to see that day's
// session. The app never enforces which weekday you actually train; this
// is just a suggested rhythm.
export default function WeekGrid({ split }) {
  const slots = weekLayout(split);
  const firstTrained = slots.findIndex((s) => s.day);
  const [selected, setSelected] = useState(firstTrained >= 0 ? firstTrained : 0);
  const sel = slots[selected];
  const trainingDays = slots.filter((s) => s.day).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-dim">Your week</span>
        <span className="text-xs text-dim">
          {trainingDays} training {trainingDays === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {slots.map((s, i) => {
          const trained = Boolean(s.day);
          const active = i === selected;
          return (
            <button
              key={s.weekday}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1.5 rounded-field border py-2 text-[11px] font-semibold transition-colors ${
                trained
                  ? "border-accent/40 bg-accent-soft text-accent hover:bg-accent-soft/70"
                  : "border-border bg-surface text-dim hover:border-border-strong"
              } ${active ? "outline outline-2 outline-accent" : ""}`}
            >
              <span>{s.weekday}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${trained ? "bg-accent" : "bg-border-strong"}`}
              />
            </button>
          );
        })}
      </div>

      <div className="rounded-field border border-border bg-surface px-3 py-2.5 text-sm">
        {sel?.day ? (
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-fg">
              {sel.weekday}: {sel.day.template.name}
            </span>
            {cleanFocus(sel.day.template.focus) ? (
              <span className="text-xs text-dim">{cleanFocus(sel.day.template.focus)}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-muted">{sel.weekday}: Rest day</span>
        )}
      </div>
    </div>
  );
}
