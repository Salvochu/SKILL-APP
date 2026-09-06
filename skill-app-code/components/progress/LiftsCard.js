"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import { shortDate } from "@/components/progress/chartkit";
import { formatWeight, fromKg, unitLabel } from "@/lib/units";

const TIER_STYLE = {
  Beginner: "bg-surface-2 text-dim",
  Novice: "bg-surface-2 text-muted",
  Intermediate: "bg-sky/15 text-sky",
  Advanced: "bg-good/15 text-good",
  Elite: "bg-accent-soft text-accent",
};

// The six movement patterns with where you stand on each, and the full
// personal-record list a tap away. Merges what used to be two cards.
export default function LiftsCard({ patterns, records, unit = "kg" }) {
  const [showAll, setShowAll] = useState(false);
  const U = unitLabel(unit);
  const conv = (kg) => Math.round(fromKg(kg, unit));

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold text-fg">Your lifts</h2>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {patterns.map((p) => (
          <li key={p.key} className="flex items-center gap-3 bg-bg/40 px-3 py-2.5">
            <span className="w-[4.75rem] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {p.label}
            </span>
            {p.e1rm > 0 ? (
              <>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.lift}</span>
                <span className="tabular shrink-0 text-sm font-semibold text-fg">
                  {conv(p.e1rm)} {U}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    TIER_STYLE[p.tier] ?? "bg-surface-2 text-dim"
                  }`}
                >
                  {p.tier}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-dim">Not trained yet</span>
            )}
          </li>
        ))}
      </ul>

      {records.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="self-start text-xs font-medium text-accent hover:underline"
          >
            {showAll ? "Hide all lifts" : `Show all ${records.length} lifts`}
          </button>

          {showAll ? (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
              {records.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3 bg-bg/40 px-3 py-2.5">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-fg">{r.name}</span>
                    <span className="flex items-center gap-2 text-xs text-dim">
                      {r.muscle ? <MusclePill muscle={r.muscle} /> : null}
                      <span className="tabular">
                        {formatWeight(r.topWeight, unit, { decimals: 0 })} x {r.topWeightReps}
                        {r.best1rmDate ? ` · ${shortDate(r.best1rmDate)}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-fg">
                    {formatWeight(r.best1rm, unit, { decimals: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
