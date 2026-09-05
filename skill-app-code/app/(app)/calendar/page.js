import { Suspense } from "react";
import { getWorkoutCalendar } from "@/lib/data/calendar";
import Calendar from "@/components/calendar/Calendar";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Calendar</h1>
        <p className="text-sm text-muted">Every training day, at a glance.</p>
      </header>

      <Suspense fallback={<div className="h-96 rounded-card bg-surface" />}>
        <CalendarBody />
      </Suspense>
    </div>
  );
}

async function CalendarBody() {
  const { sessions, bodyDates } = await getWorkoutCalendar();
  return <Calendar sessions={sessions} bodyDates={bodyDates} />;
}
