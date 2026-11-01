"use client";

import { useState } from "react";

const WINDOWS = [
  ["all", "All time"],
  ["d30", "30 days"],
  ["d7", "7 days"],
];

// The 14-Day Challenge funnel on the coach's Clients screen: sign-ups to
// paying members, step by step (data from lib/data/coach.js
// challengeFunnel). Bars are against sign-ups; the small percentage is
// how many made it from the step before.
export default function ChallengeFunnel({ funnel }) {
  const [win, setWin] = useState("all");
  if (!funnel) return null;
  const data = funnel[win];
  const total = data.steps[0].count;

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">14-Day Challenge funnel</h2>
        <div role="radiogroup" aria-label="Time window" className="flex rounded-[10px] bg-surface-2 p-0.5">
          {WINDOWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={win === key}
              onClick={() => setWin(key)}
              className={`flex-1 whitespace-nowrap rounded-[8px] py-1.5 text-[13px] font-semibold transition-colors ${
                win === key ? "bg-fg text-bg shadow-sm" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="py-4 text-center text-[15px] text-muted">No challenge sign-ups in this window yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.steps.map((step, i) => {
            const prev = i > 0 ? data.steps[i - 1].count : null;
            const ofPrev = prev ? Math.round((step.count / prev) * 100) : null;
            const width = total ? Math.max(step.count > 0 ? 3 : 0, (step.count / total) * 100) : 0;
            return (
              <li key={step.key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] text-fg">{step.label}</span>
                  <span className="flex items-baseline gap-2 tabular-nums">
                    {ofPrev != null ? <span className="text-[12px] text-dim">{ofPrev}% of previous</span> : null}
                    <span className="text-[17px] font-semibold text-fg">{step.count}</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
                  <div
                    className={`h-full rounded-full ${step.key === "paid" ? "bg-good" : "bg-accent"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {data.active > 0 || data.preparing > 0 ? (
        <p className="text-[13px] leading-snug text-muted">
          Not counted as drop-offs yet:{" "}
          {[
            data.active > 0 ? `${data.active} still in their 14 days` : null,
            data.preparing > 0 ? `${data.preparing} getting ready to start` : null,
          ]
            .filter(Boolean)
            .join(", ")}
          .
        </p>
      ) : null}
    </section>
  );
}
