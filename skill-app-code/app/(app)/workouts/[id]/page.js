import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { getUnitPreference } from "@/lib/data/profile";
import { EFFORT_LABELS } from "@/lib/training";
import { formatWeight } from "@/lib/units";
import LoggedAt from "@/components/LoggedAt";
import WorkoutSets from "@/components/workouts/WorkoutSets";

export const metadata = { title: "Workout" };

// Reads the dynamic [id] param directly with no useful static shell (a
// past session's detail is entirely per-request, per-user data), same
// reasoning as app/(app)/log/page.js.
export const instant = false;

export default async function WorkoutDetailPage({ params }) {
  const { id } = await params;
  const [workout, unit] = await Promise.all([getWorkoutDetail(id), getUnitPreference()]);
  if (!workout) notFound();

  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 self-start text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <IconChevron className="h-4 w-4 rotate-90" />
        Dashboard
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">{workout.title}</h1>
        <p className="text-sm text-muted">
          <LoggedAt iso={workout.date} withYear />
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Volume</span>
          <span className="tabular text-2xl font-bold text-fg">{formatWeight(workout.volumeKg, unit, { decimals: 0 })}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Duration</span>
          <span className="tabular text-2xl font-bold text-fg">
            {workout.durationMin != null ? `${workout.durationMin}m` : "—"}
          </span>
        </div>
      </div>

      {workout.perceivedEffort ? (
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Effort</span>
          <span className="text-sm font-medium text-fg">{EFFORT_LABELS[workout.perceivedEffort]}</span>
        </div>
      ) : null}

      {workout.notes ? (
        <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Session notes</h2>
          <p className="text-sm text-muted">{workout.notes}</p>
        </section>
      ) : null}

      <WorkoutSets
        sessionId={workout.id}
        title={workout.title}
        dateOnly={workout.date.slice(0, 10)}
        exercises={workout.exercises}
        unit={unit}
      />
    </div>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
