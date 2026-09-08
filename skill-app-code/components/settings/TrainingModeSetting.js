"use client";

import { useState } from "react";
import { setAdvancedTracking } from "@/app/(app)/profile/actions";

// The switch between the simple app and the full one. On = reps in
// reserve in the logger, program weeks and RIR targets, the strength
// benchmark, and the trend charts on Progress. Off keeps all of that
// hidden and swaps the RIR box for a "taken to failure" tap.
export default function TrainingModeSetting({ initialAdvanced, isExplicit }) {
  const [advanced, setAdvanced] = useState(initialAdvanced);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function toggle(next) {
    setAdvanced(next);
    setPending(true);
    setError(null);
    const res = await setAdvancedTracking(next);
    setPending(false);
    if (res?.error) {
      setAdvanced(!next);
      setError(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-dim">Training detail</h2>
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-fg">Advanced tracking</span>
            <span className="text-xs text-dim">
              Reps in reserve, program weeks, the strength benchmark, and trend charts.
              Off keeps things simple and lets you just mark a set as taken to failure.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={advanced}
            aria-label="Advanced tracking"
            disabled={pending}
            onClick={() => toggle(!advanced)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
              advanced ? "border-accent bg-accent" : "border-border bg-surface-2"
            }`}
          >
            <span
              className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
                advanced ? "translate-x-[22px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
        {!isExplicit ? (
          <p className="text-[11px] text-dim">
            {advanced ? "On" : "Off"} by default for your experience level. Flip it any time.
          </p>
        ) : null}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </section>
    </div>
  );
}
