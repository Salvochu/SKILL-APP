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
  none: { sym: "–", cls: "text-dim" },
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
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span><span className="font-semibold text-fg">{totals.count}</span> clients</span>
        <span><span className="font-semibold text-fg">{totals.activeThisWeek}</span> active this week</span>
        <span><span className="font-semibold text-fg">{totals.flagged}</span> flagged</span>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
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
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === k ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No clients here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shown.map((c) => {
            const dir = DIR[c.strengthDir] ?? DIR.none;
            return (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate font-display text-base font-semibold text-fg">{c.name}</span>
                      <span className="block truncate text-xs text-dim">
                        {[c.goal, c.experience].filter(Boolean).join(" · ") || "No profile details"}
                      </span>
                    </div>
                    <IconChevron className="mt-1 h-4 w-4 shrink-0 text-dim" />
                  </div>

                  {c.flags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.flags.map((f) => (
                        <span
                          key={f.key}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${FLAG_TONE[f.tone] ?? FLAG_TONE.sky}`}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>Last {ago(c.lastWorkoutAt)}</span>
                    <span className="text-dim">|</span>
                    <span><span className="font-semibold text-fg">{c.sessionsThisWeek}</span> this week</span>
                    <span className="text-dim">|</span>
                    <span><span className="font-semibold text-fg">{c.streak}</span>w streak</span>
                    <span className="text-dim">|</span>
                    <span>
                      Strength <span className={`font-semibold ${dir.cls}`}>{dir.sym}</span>
                      {c.strengthDelta != null && c.strengthDelta !== 0 ? (
                        <span className={`ml-0.5 font-semibold ${dir.cls}`}>
                          {c.strengthDelta > 0 ? "+" : ""}{c.strengthDelta}
                        </span>
                      ) : null}
                    </span>
                    {c.weightDelta != null ? (
                      <>
                        <span className="text-dim">|</span>
                        <span>
                          Weight{" "}
                          <span className="font-semibold text-fg">
                            {c.weightDelta > 0 ? "+" : ""}{c.weightDelta} {c.unit}
                          </span>
                          <span className="text-dim">/mo</span>
                        </span>
                      </>
                    ) : null}
                  </div>
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
