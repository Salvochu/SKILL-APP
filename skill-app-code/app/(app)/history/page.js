import { Suspense } from "react";
import { getAllWorkoutSessions } from "@/lib/data/workouts";
import HistoryList from "@/components/history/HistoryList";

export const metadata = { title: "Workout History" };

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Workout History</h1>
        <p className="text-[15px] text-muted">Every session you have logged.</p>
      </header>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryBody />
      </Suspense>
    </div>
  );
}

async function HistoryBody() {
  const sessions = await getAllWorkoutSessions();
  return <HistoryList sessions={sessions} />;
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="ml-4 h-3 w-24 rounded-full skeleton bg-surface-2" />
      <div className="h-48 rounded-2xl skeleton bg-surface-2" />
      <div className="ml-4 mt-4 h-3 w-24 rounded-full skeleton bg-surface-2" />
      <div className="h-32 rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}
