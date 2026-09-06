import { Suspense } from "react";
import { getAllWorkoutSessions } from "@/lib/data/workouts";
import HistoryList from "@/components/history/HistoryList";

export const metadata = { title: "Workout History" };

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Workout History</h1>
        <p className="text-sm text-muted">Every session you have logged.</p>
      </header>

      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
        <HistoryBody />
      </Suspense>
    </div>
  );
}

async function HistoryBody() {
  const sessions = await getAllWorkoutSessions();
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-4">
      <HistoryList sessions={sessions} />
    </div>
  );
}
