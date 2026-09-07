import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import { getMesocycleTemplates, getActiveMesocycle } from "@/lib/data/mesocycles";
import SplitsBrowser from "@/components/splits/SplitsBrowser";

export const metadata = { title: "Train" };

export default function SplitsPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Train</h1>
        <p className="text-sm text-muted">Start a session, run a program, or check your strength.</p>
      </header>

      <Suspense fallback={<SplitsSkeleton />}>
        <SplitsList />
      </Suspense>
    </div>
  );
}

async function SplitsList() {
  const [splits, mesocycleTemplates, active] = await Promise.all([
    getSplits(),
    getMesocycleTemplates(),
    getActiveMesocycle(),
  ]);
  const strengthCheck = splits.find((s) => s.id === "strength-check") ?? null;
  const browsable = splits.filter((s) => s.section !== "benchmark");
  const activeProgram =
    active && !active.isComplete ? { splitName: active.splitName, week: active.week, weeks: active.weeks } : null;
  return (
    <SplitsBrowser
      splits={browsable}
      strengthCheck={strengthCheck}
      mesocycleTemplates={mesocycleTemplates}
      activeProgram={activeProgram}
    />
  );
}

function SplitsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[76px] w-full rounded-card bg-surface" />
      ))}
    </div>
  );
}
