"use client";

import { useState } from "react";
import Link from "next/link";
import MusclePill from "@/components/MusclePill";
import { shortDate } from "@/components/progress/chartkit";
import { formatWeight, fromKg, unitLabel } from "@/lib/units";

function agoLabel(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

const TIER_STYLE = {
  Beginner: "bg-surface-2 text-dim",
  Novice: "bg-surface-2 text-muted",
  Intermediate: "bg-sky/15 text-sky",
  Advanced: "bg-good/15 text-good",
  Elite: "bg-accent-soft text-accent",
};

// How strong you are: the Strength Score, then the six movement patterns
// that make it up, then the full personal-record list a tap away.
export default function StrengthCard({ strength, records, unit = "kg", lastCheck = null }) {
  const [showAll, setShowAll] = useState(false);
  const U = unitLabel(unit);
  const conv = (kg) => Math.round(fromKg(kg, unit));
  const score = strength && strength.covered > 0 ? conv(strength.score) : null;
  const patterns = strength?.patterns ?? [];

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-dim">Strength score</span>
        <span className="tabular text-4xl font-bold text-fg">
          {score != null ? score : "—"}
          {score != null ? <span className="ml-1.5 text-lg font-semibold text-dim">{U}</span> : null}
        </span>
        <span className="text-xs text-dim">Best estimated 1RM across six lifts, last 6 weeks</span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-field border border-border bg-bg/40 px-3 py-2 text-xs">
        <span className="text-dim">
          {lastCheck ? `Last Strength Check ${agoLabel(lastCheck.date)}` : "No Strength Check logged yet"}
        </span>
        <Link
          href="/splits?view=strength-check"
          className="shrink-0 font-semibold text-accent hover:underline"
        >
          {lastCheck ? "Re-test" : "Run it"}
        </Link>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {patterns.map((p) => {
          const row = (
            <>
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
            </>
          );
          return (
            <li key={p.key}>
              {p.exId ? (
                <Link
                  href={`/library/exercises/${p.exId}`}
                  className="flex items-center gap-3 bg-bg/40 px-3 py-2.5 transition-colors hover:bg-surface-2"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3 bg-bg/40 px-3 py-2.5">{row}</div>
              )}
            </li>
          );
        })}
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
