"use client";

import { weekLayout } from "@/lib/splitWeek";

// The example training week for a split: seven weekday squares, training
// days in light orange, rest days plain. Controlled - the parent owns
// which slot is selected and renders that day's session below the grid.
// The app never enforces which weekday you actually train; this is just a
// suggested rhythm.
export default function WeekGrid({ split, selectedIndex, onSelect }) {
  const slots = weekLayout(split);
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
          const active = i === selectedIndex;
          return (
            <button
              key={s.weekday}
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={active}
              aria-label={`${s.weekday}${trained ? `: ${s.day.template.name}` : ": rest day"}`}
              className={`flex flex-col items-center gap-1.5 rounded-field border py-2 text-[11px] font-semibold transition-colors ${
                trained
                  ? "border-accent/40 bg-accent-soft text-accent hover:bg-accent-soft/70"
                  : "border-border bg-surface text-dim hover:border-border-strong"
              } ${active ? "outline outline-2 outline-accent" : ""}`}
            >
              <span>{s.weekday}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${trained ? "bg-accent" : "bg-border-strong"}`} />
            </button>
          );
        })}
      </div>

      <p className="text-xs text-dim">Tap a day to see the session.</p>
    </div>
  );
}
