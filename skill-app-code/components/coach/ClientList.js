"use client";

import { useState } from "react";
import Link from "next/link";

const FLAG_TONE = {
  accent: "bg-accent-soft text-accent",
  good: "bg-good/15 text-good",
  danger: "bg-danger/15 text-danger",
  sky: "bg-sky/15 text-sky",
};

function ago(iso) {
  if (!iso) return "never";
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 21) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

const DIR = {
  up: { sym: "↑", cls: "text-good" },
  down: { sym: "↓", cls: "text-danger" },
  flat: { sym: "→", cls: "text-dim" },
  none: { sym: "·", cls: "text-dim" },
};

export default function ClientList({ data }) {
  const { clients, totals } = data;
  const [filter, setFilter] = useState("all");

  const shown = clients.filter((c) => {
    if (filter === "flagged") return c.flags.length > 0;
    if (filter === "active") return c.sessionsThisWeek > 0;
    if (filter === "quiet") return c.daysSinceWorkout != null && c.daysSinceWorkout >= 10;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-muted">
        <span><span className="font-semibold text-fg tabular-nums">{totals.count}</span> clients</span>
        <span className="text-dim" aria-hidden="true">·</span>
        <span><span className="font-semibold text-fg tabular-nums">{totals.activeThisWeek}</span> active this week</span>
        <span className="text-dim" aria-hidden="true">·</span>
        <span><span className="font-semibold text-fg tabular-nums">{totals.flagged}</span> flagged</span>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {[
          ["all", "All"],
          ["flagged", "Flagged"],
          ["active", "Active this week"],
          ["quiet", "Gone quiet"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === k ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-[15px] text-muted">No clients here.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
          {shown.map((c) => {
            const dir = DIR[c.strengthDir] ?? DIR.none;
            return (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="flex pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2">
                  <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3.5 pr-4">
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[16px] font-semibold text-fg">{c.name}</span>
                        <span className="truncate text-[13px] text-dim">
                          {[c.goal, c.experience].filter(Boolean).join(" · ") || "No profile details"}
                        </span>
                      </span>

                      {c.flags.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {c.flags.map((f) => (
                            <span
                              key={f.key}
                              className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${FLAG_TONE[f.tone] ?? FLAG_TONE.sky}`}
                            >
                              {f.label}
                            </span>
                          ))}
                        </span>
                      ) : null}

                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                        <span>Last {ago(c.lastWorkoutAt)}</span>
                        <span className="text-dim" aria-hidden="true">·</span>
                        <span><span className="font-semibold text-fg tabular-nums">{c.sessionsThisWeek}</span> this week</span>
                        <span className="text-dim" aria-hidden="true">·</span>
                        <span><span className="font-semibold text-fg tabular-nums">{c.streak}</span>w streak</span>
                        <span className="text-dim" aria-hidden="true">·</span>
                        <span>
                          Strength <span className={`font-semibold ${dir.cls}`}>{dir.sym}</span>
                          {c.strengthDelta != null && c.strengthDelta !== 0 ? (
                            <span className={`ml-0.5 font-semibold tabular-nums ${dir.cls}`}>
                              {c.strengthDelta > 0 ? "+" : ""}{c.strengthDelta}
                            </span>
                          ) : null}
                        </span>
                        {c.weightDelta != null ? (
                          <>
                            <span className="text-dim" aria-hidden="true">·</span>
                            <span>
                              Weight{" "}
                              <span className="font-semibold text-fg tabular-nums">
                                {c.weightDelta > 0 ? "+" : ""}{c.weightDelta} {c.unit}
                              </span>
                              <span className="text-dim">/mo</span>
                            </span>
                          </>
                        ) : null}
                      </span>
                    </span>
                    <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
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
