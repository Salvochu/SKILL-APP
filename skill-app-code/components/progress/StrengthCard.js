"use client";

import { useState } from "react";
import Link from "next/link";
import MusclePill from "@/components/MusclePill";
import { shortDate } from "@/components/progress/chartkit";
import { formatWeight, fromKg, unitLabel } from "@/lib/units";
import { tierColorFor } from "@/lib/strength";

function agoLabel(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

// Where your main lifts stand right now, framed around the Strength Check.
// Tested lifts show as a bar along the Beginner to Elite scale; the rest
// collapse to one line. The full personal-record list is a tap away.
export default function StrengthCard({ strength, records = [], unit = "kg", lastCheck = null }) {
  const [showAll, setShowAll] = useState(false);
  const U = unitLabel(unit);
  const conv = (kg) => Math.round(fromKg(kg, unit));
  const patterns = strength?.patterns ?? [];
  const tested = patterns.filter((p) => p.e1rm > 0);
  const untested = patterns.length - tested.length;
  const totalLabel = tested.length > 0 ? `${conv(strength.score)} ${U}` : null;

  const checkLine = lastCheck
    ? `Strength Check ${agoLabel(lastCheck.date)}`
    : "No Strength Check yet";

  // Nothing tested at all: the card is a single invitation to benchmark.
  if (tested.length === 0) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-fg">Take your first Strength Check</h2>
        <p className="text-sm text-muted">
          One hard top set on six main lifts. See where each one stands, then re-test every 4 to 6 weeks.
        </p>
        <Link
          href="/splits?view=strength-check"
          className="rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start Strength Check
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-dim">{checkLine}</span>
        <Link
          href="/splits?view=strength-check"
          className="shrink-0 rounded-field border border-border px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-border-strong"
        >
          {lastCheck ? "Re-test" : "Start"}
        </Link>
      </div>

      <ul className="flex flex-col gap-3.5">
        {tested.map((p) => {
          const color = tierColorFor(p.tierIndex);
          return (
            <li key={p.key}>
              <Link
                href={p.exId ? `/library/exercises/${p.exId}` : "/progress"}
                className="group flex flex-col gap-1.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-fg group-hover:text-accent">
                    {p.lift}
                  </span>
                  <span className="tabular shrink-0 text-xs text-muted">
                    <span className="font-semibold text-fg">{conv(p.e1rm)} {U}</span>
                    <span className="mx-1 text-dim">·</span>
                    <span className="font-semibold" style={{ color }}>{p.tier}</span>
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="bar-fill absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.round((p.barFrac ?? 0) * 100)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-wide text-dim">
                  <span>Beginner</span>
                  <span>Elite</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
        <span className="text-dim">
          {untested > 0
            ? `${untested} lift${untested === 1 ? "" : "s"} not tested yet`
            : "All six patterns tested"}
        </span>
        {totalLabel ? <span className="tabular text-dim">total {totalLabel}</span> : null}
      </div>

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
    </div>
  );
}
