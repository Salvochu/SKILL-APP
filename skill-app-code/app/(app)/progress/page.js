import { Suspense } from "react";
import { getWorkoutSummary } from "@/lib/data/workouts";

export const metadata = { title: "Progress" };

// Charts (strength per lift, volume over time) land here once the logger is
// in place. For now: the headline number and an empty state.
export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Progress</h1>
        <p className="text-sm text-muted">Track strength gains and training volume over time.</p>
      </header>
      <Suspense fallback={<div className="h-40 rounded-card bg-surface" />}>
        <ProgressBody />
      </Suspense>
    </div>
  );
}

async function ProgressBody() {
  const s = await getWorkoutSummary();
  return (
    <>
      <div className="inline-flex w-fit flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-dim">Total volume</span>
        <span className="tabular text-2xl font-bold text-fg">
          {(s.volumeKg / 1000).toFixed(1)}k kg
        </span>
      </div>
      {s.workouts === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          No data yet. Log a workout to start tracking progress.
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
          {s.workouts} workouts logged. Charts are coming next.
        </div>
      )}
    </>
  );
}
