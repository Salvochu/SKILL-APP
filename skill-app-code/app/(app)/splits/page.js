import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import { getMesocycleTemplates, getActiveMesocycle } from "@/lib/data/mesocycles";
import { getBeginnerContext } from "@/lib/data/profile";
import SplitsBrowser from "@/components/splits/SplitsBrowser";

export const metadata = { title: "Train" };

export default function SplitsPage({ searchParams }) {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Train</h1>
        <p className="text-sm text-muted">Start a session, run a program, or check your strength.</p>
      </header>

      <Suspense fallback={<SplitsSkeleton />}>
        <SplitsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SplitsList({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const initialView = typeof sp.view === "string" ? sp.view : null;
  const [splits, mesocycleTemplates, active, beginner] = await Promise.all([
    getSplits(),
    getMesocycleTemplates(),
    getActiveMesocycle(),
    getBeginnerContext(),
  ]);
  // The Strength Check stays hidden for a new beginner - working up to a
  // heavy top set is not a week-one exercise.
  const strengthCheck = beginner.showStrengthCheck
    ? splits.find((s) => s.id === "strength-check") ?? null
    : null;
  const browsable = splits.filter(
    (s) => s.section !== "benchmark" && s.section !== "foundations",
  );
  const activeProgram =
    active && !active.isComplete ? { splitName: active.splitName, week: active.week, weeks: active.weeks } : null;

  // Foundations: a beginner's first month. Shown as its own card, and
  // only while they have not already got a program running.
  const foundationsSplit = splits.find((s) => s.id === "foundations") ?? null;
  const foundations = beginner.isBeginner && !active && foundationsSplit ? foundationsSplit : null;

  return (
    <SplitsBrowser
      splits={browsable}
      strengthCheck={strengthCheck}
      mesocycleTemplates={mesocycleTemplates}
      activeProgram={activeProgram}
      initialView={initialView}
      isBeginner={beginner.isBeginner}
      foundations={foundations}
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
