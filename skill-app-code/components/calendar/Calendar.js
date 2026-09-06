"use client";

import { useMemo, useState } from "react";
import TapLink from "@/components/TapLink";
import { compact } from "@/components/progress/chartkit";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar({ sessions, bodyDates }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(ymd(today));

  const byDay = useMemo(() => {
    const m = new Map();
    for (const s of sessions) {
      if (!m.has(s.date)) m.set(s.date, []);
      m.get(s.date).push(s);
    }
    return m;
  }, [sessions]);
  const bodySet = useMemo(() => new Set(bodyDates), [bodyDates]);

  const first = new Date(view.year, view.month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayKey = ymd(today);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.year, view.month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const step = (delta) => {
    const m = view.month + delta;
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };

  const selectedSessions = byDay.get(selected) ?? [];
  const monthCount = [...byDay.entries()].filter(([k]) => k.startsWith(
    `${view.year}-${String(view.month + 1).padStart(2, "0")}`,
  )).reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => step(-1)} aria-label="Previous month" className="rounded-field p-2 text-muted hover:bg-surface-2 hover:text-fg">
          <IconChevron className="h-4 w-4 rotate-180" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-fg">
            {MONTHS[view.month]} {view.year}
          </span>
          <span className="text-xs text-dim">{monthCount} {monthCount === 1 ? "workout" : "workouts"}</span>
        </div>
        <button type="button" onClick={() => step(1)} aria-label="Next month" className="rounded-field p-2 text-muted hover:bg-surface-2 hover:text-fg">
          <IconChevron className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d) => (
          <span key={d} className="pb-1 text-[10px] font-medium uppercase tracking-wider text-dim">{d}</span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const key = ymd(date);
          const has = byDay.has(key);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-field text-sm transition-colors ${
                isSelected ? "bg-accent-soft text-accent" : "text-fg hover:bg-surface-2"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-border-strong" : ""}`}
            >
              <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
              <span className="absolute bottom-1 flex gap-0.5">
                {has ? <span className="h-1 w-1 rounded-full bg-accent" /> : null}
                {bodySet.has(key) ? <span className="h-1 w-1 rounded-full bg-fg/40" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
          {new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
          })}
        </h2>
        {selectedSessions.length === 0 ? (
          <p className="text-sm text-muted">
            {bodySet.has(selected) ? "Body check-in logged." : "Nothing logged this day."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
            {selectedSessions.map((s) => (
              <li key={s.id}>
                <TapLink href={`/workouts/${s.id}`} className="flex items-center justify-between gap-3 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2">
                  <span className="text-sm font-medium text-fg">{s.title}</span>
                  <span className="tabular shrink-0 text-xs text-dim">{compact(s.volumeKg)} kg</span>
                </TapLink>
              </li>
            ))}
            {bodySet.has(selected) ? (
              <li className="bg-surface px-3 py-2.5 text-xs text-dim">Body check-in logged</li>
            ) : null}
          </ul>
        )}
      </div>
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
