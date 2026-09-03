import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import SplitsBrowser from "@/components/splits/SplitsBrowser";

export const metadata = { title: "Splits" };

export default function SplitsPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Training Splits</h1>
        <p className="text-sm text-muted">
          Pick the split that matches your week, then start a session.
        </p>
      </header>

      <Suspense fallback={<SplitsSkeleton />}>
        <SplitsList />
      </Suspense>
    </div>
  );
}

async function SplitsList() {
  const splits = await getSplits();
  return <SplitsBrowser splits={splits} />;
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
