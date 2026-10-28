"use client";

import { useMemo, useState } from "react";
import TapLink from "@/components/TapLink";
import { compact } from "@/components/progress/chartkit";
import { fromKg, unitLabel } from "@/lib/units";
import { useHydrated } from "@/components/useHydrated";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar({ sessions, bodyDates, unit = "kg" }) {
  // Today is the phone's date, which can be a day either side of the
  // server's (UTC). The server and the first render in the browser both
  // use the UTC date so they match; the phone's own date takes over
  // straight after. Until the person picks a day or month, both follow
  // today.
  const hydrated = useHydrated();
  const todayKey = hydrated ? ymd(new Date()) : new Date().toISOString().slice(0, 10);
  const [pickedView, setView] = useState(null);
  const [pickedDay, setSelected] = useState(null);
  const view = pickedView ?? { year: Number(todayKey.slice(0, 4)), month: Number(todayKey.slice(5, 7)) - 1 };
  const selected = pickedDay ?? todayKey;

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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col pl-1">
            <span className="text-[20px] font-bold tracking-[-0.015em] text-fg">
              {MONTHS[view.month]} {view.year}
            </span>
            <span className="text-[13px] text-muted">
              <span className="font-semibold text-fg tabular-nums">{monthCount}</span>{" "}
              {monthCount === 1 ? "workout" : "workouts"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <IconChevron className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <IconChevron className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center">
          {DOW.map((d) => (
            <span key={d} className="pb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-dim">
              {d.slice(0, 1)}
            </span>
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
                aria-pressed={isSelected}
                aria-label={`${date.getDate()} ${MONTHS[view.month]}${has ? ", workout logged" : ""}`}
                className="group/day relative flex aspect-square flex-col items-center justify-center"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[16px] tabular-nums transition-colors ${
                    isSelected
                      ? isToday
                        ? "bg-accent font-bold text-black"
                        : "bg-fg font-semibold text-bg"
                      : isToday
                        ? "font-bold text-accent group-hover/day:bg-fg/5"
                        : "text-fg group-hover/day:bg-fg/5"
                  }`}
                >
                  {date.getDate()}
                </span>
                <span className="absolute bottom-0.5 flex h-1.5 gap-0.5">
                  {has ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                  {bodySet.has(key) ? <span className="h-1.5 w-1.5 rounded-full bg-fg/40" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 pt-1 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Workout
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-fg/40" /> Body check-in
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
          {new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </h2>
        {selectedSessions.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-3.5 text-[15px] text-muted">
            {bodySet.has(selected) ? "Body check-in logged." : "Nothing logged this day."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
            {selectedSessions.map((s) => (
              <li key={s.id}>
                <TapLink
                  href={`/workouts/${s.id}`}
                  className="flex pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3.5 pr-4">
                    <span className="min-w-0 flex-1 truncate text-[16px] text-fg">{s.title}</span>
                    <span className="tabular shrink-0 text-[14px] text-muted">{compact(Math.round(fromKg(s.volumeKg, unit)))} {unitLabel(unit)}</span>
                    <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                  </span>
                </TapLink>
              </li>
            ))}
            {bodySet.has(selected) ? (
              <li>
                <span className="flex pl-4">
                  <span className="row-sep flex-1 border-t border-border/70 py-3.5 pr-4 text-[15px] text-muted">
                    Body check-in logged
                  </span>
                </span>
              </li>
            ) : null}
          </ul>
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
