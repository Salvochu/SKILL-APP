import { Suspense } from "react";
import { getWorkoutCalendar } from "@/lib/data/calendar";
import { getUnitPreference } from "@/lib/data/profile";
import Calendar from "@/components/calendar/Calendar";
import BackLink from "@/components/ui/BackLink";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Calendar</h1>
        <p className="text-[15px] text-muted">Every training day, at a glance.</p>
      </header>

      <Suspense fallback={<div className="h-[26rem] rounded-2xl skeleton bg-surface-2" />}>
        <CalendarBody />
      </Suspense>
    </div>
  );
}

async function CalendarBody() {
  const [{ sessions, bodyDates }, unit] = await Promise.all([getWorkoutCalendar(), getUnitPreference()]);
  return <Calendar sessions={sessions} bodyDates={bodyDates} unit={unit} />;
}
