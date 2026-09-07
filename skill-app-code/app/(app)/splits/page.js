import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import { getBeginnerContext } from "@/lib/data/profile";
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
  const [splits, beginner] = await Promise.all([getSplits(), getBeginnerContext()]);

  const strengthCheck = beginner.showStrengthCheck
    ? splits.find((s) => s.id === "strength-check") ?? null
    : null;
  const browsable = splits.filter(
    (s) => s.section !== "benchmark" && s.section !== "foundations",
  );
  const foundationsSplit = splits.find((s) => s.id === "foundations") ?? null;
  const foundations = beginner.isBeginner && foundationsSplit ? foundationsSplit : null;

  return (
    <SplitsList
      splits={browsable}
      strengthCheck={strengthCheck}
      foundations={foundations}
      isBeginner={beginner.isBeginner}
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
