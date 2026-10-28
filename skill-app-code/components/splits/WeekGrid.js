"use client";

import { weekLayout } from "@/lib/splitWeek";

// The example training week as a calendar-style strip (think Apple
// Fitness): seven weekday letters, a dot under each training day, the
// selected day filled in. No boxes - the selection is the only shape.
// Controlled: the parent owns the selected slot and renders that day's
// session below. The app never enforces which weekday you train; this is
// just a suggested rhythm.
export default function WeekGrid({ split, selectedIndex, onSelect }) {
  const slots = weekLayout(split);
  const trainingDays = slots.filter((s) => s.day).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-fg">Your week</span>
        <span className="text-[13px] text-dim">
          {trainingDays} training {trainingDays === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="grid grid-cols-7">
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
              className="group flex flex-col items-center gap-1.5 py-1"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-semibold transition-[background-color,color,transform] duration-150 group-active:scale-90 ${
                  active
                    ? "bg-accent text-black"
                    : trained
                      ? "text-fg group-hover:bg-surface-2"
                      : "text-dim group-hover:bg-surface-2"
                }`}
              >
                {s.weekday.slice(0, 1)}
              </span>
              <span
                className={`h-1 w-1 rounded-full transition-opacity ${trained ? "bg-accent" : "opacity-0"} ${
                  active ? "opacity-0" : ""
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
