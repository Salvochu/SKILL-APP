"use client";

import { useState } from "react";
import Link from "next/link";
import MusclePill from "@/components/MusclePill";
import Explain from "@/components/Explain";
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
export default function StrengthCard({
  strength,
  records = [],
  unit = "kg",
  lastCheck = null,
  showStrengthCheck = true,
}) {
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

  // Nothing tested at all, and the Strength Check is available: the card
  // is a single invitation to benchmark. (When it is not available - a
  // brand-new beginner - the page renders nothing here.)
  if (tested.length === 0) {
    if (!showStrengthCheck) return null;
    return (
      <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <IconGauge className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">Take your first Strength Check</h2>
            <p className="text-[15px] leading-relaxed text-muted">
              One hard top set on six main lifts. See where each one stands, then re-test every 4 to 6 weeks.
            </p>
          </div>
        </div>
        <Link
          href="/splits/strength-check"
          className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
        >
          Start Strength Check
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {showStrengthCheck ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-muted">{checkLine}</span>
          <Link
            href="/splits/strength-check"
            className="shrink-0 rounded-full bg-accent-soft px-3.5 py-1.5 text-[14px] font-semibold text-accent transition-transform active:scale-95"
          >
            {lastCheck ? "Re-test" : "Start"}
          </Link>
        </div>
      ) : null}

      <ul className="flex flex-col gap-4">
        {tested.map((p) => {
          const color = tierColorFor(p.tierIndex);
          return (
            <li key={p.key}>
              <Link
                href={p.exId ? `/library/exercises/${p.exId}` : "/progress"}
                className="group flex flex-col gap-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[16px] font-medium text-fg group-hover:text-accent">
                    {p.lift}
                  </span>
                  <span className="tabular shrink-0 text-[14px] text-muted">
                    <span className="font-semibold text-fg">{conv(p.e1rm)} {U}</span>
                    <span className="mx-1.5 text-dim">·</span>
                    <span className="font-semibold" style={{ color }}>{p.tier}</span>
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-fg/10">
                  <div
                    className="bar-fill absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.round((p.barFrac ?? 0) * 100)}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.04em] text-dim">
                  <span>Beginner</span>
                  <span>Elite</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3.5 text-[13px]">
        <span className="text-muted">
          {untested > 0
            ? `${untested} lift${untested === 1 ? "" : "s"} ${
                showStrengthCheck ? "not tested yet" : "not trained lately"
              }`
            : showStrengthCheck
              ? "All six patterns tested"
              : "All six patterns trained"}
        </span>
        {totalLabel ? (
          <span className="tabular flex items-center gap-1.5 text-muted">
            total {totalLabel}
            <Explain k="strengthScore" />
          </span>
        ) : null}
      </div>

      {records.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="-my-1 self-start rounded-lg py-1 text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
          >
            {showAll ? "Hide all lifts" : `Show all ${records.length} lifts`}
          </button>

          {showAll ? (
            <ul className="-mt-2 flex flex-col [&>*+*]:border-t [&>*+*]:border-border/70">
              {records.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[16px] font-medium text-fg">{r.name}</span>
                    <span className="flex items-center gap-2 text-[13px] text-muted">
                      {r.muscle ? <MusclePill muscle={r.muscle} /> : null}
                      <span className="tabular">
                        {formatWeight(r.topWeight, unit, { decimals: 0 })} x {r.topWeightReps}
                        {r.best1rmDate ? ` · ${shortDate(r.best1rmDate)}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[16px] font-semibold text-fg">
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

function IconGauge(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 18a9 9 0 1 1 15 0" />
      <path d="m12 13 3.5-4" />
      <circle cx="12" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}
