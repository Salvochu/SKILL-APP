import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getBeginnerContext } from "@/lib/data/profile";
import { getMyWorkouts } from "@/lib/data/myWorkouts";
import SplitsList from "@/components/splits/SplitsList";

export const metadata = { title: "Train" };

export default function SplitsPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Train</h1>
        <p className="text-sm text-muted">Start a session, run a program, or check your strength.</p>
      </header>

      <Suspense fallback={<SplitsSkeleton />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const [splits, beginner, active, myWorkouts] = await Promise.all([
    getSplits(),
    getBeginnerContext(),
    getActiveMesocycle(),
    getMyWorkouts(),
  ]);

  const strengthCheck = beginner.showStrengthCheck
    ? splits.find((s) => s.id === "strength-check") ?? null
    : null;
  const browsable = splits.filter(
    (s) => s.section !== "benchmark" && s.section !== "foundations",
  );
  // Only offer Foundations while a beginner has no program running -
  // starting it again would abandon the one in progress.
  const foundationsSplit = splits.find((s) => s.id === "foundations") ?? null;
  const foundations =
    beginner.isBeginner && !active && foundationsSplit ? foundationsSplit : null;

  return (
    <SplitsList
      splits={browsable}
      strengthCheck={strengthCheck}
      foundations={foundations}
      isBeginner={beginner.isBeginner}
      myWorkouts={myWorkouts}
    />
  );
}

function SplitsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[76px] w-full rounded-card skeleton bg-surface-2" />
      ))}
    </div>
  );
}
