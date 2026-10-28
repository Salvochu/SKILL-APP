import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { getUnitPreference } from "@/lib/data/profile";
import { EFFORT_LABELS } from "@/lib/training";
import { fromKg, unitLabel } from "@/lib/units";
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

  const volume = Math.round(fromKg(workout.volumeKg, unit) || 0).toLocaleString("en-GB");
  const mins = workout.durationMin;
  const effort = workout.perceivedEffort ? EFFORT_LABELS[workout.perceivedEffort] : null;

  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/dashboard"
        className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <IconBack className="h-5 w-5" />
        Dashboard
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          {workout.title}
        </h1>
        <p className="text-[15px] text-muted">
          <LoggedAt iso={workout.date} withYear />
        </p>
      </header>

      {/* One summary strip (Apple Fitness style) instead of a box per stat. */}
      <div
        className={`grid rounded-2xl bg-surface py-4 [&>*+*]:border-l [&>*+*]:border-border/70 ${
          effort ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        <Stat label="Volume" value={volume} unit={unitLabel(unit)} />
        {mins == null ? (
          <Stat label="Duration" value="n/a" />
        ) : mins >= 60 ? (
          <Stat label="Duration" value={`${Math.floor(mins / 60)}h ${mins % 60}m`} />
        ) : (
          <Stat label="Duration" value={mins} unit="min" />
        )}
        {effort ? <Stat label="Effort" value={effort} small /> : null}
      </div>

      {workout.notes ? (
        <section className="flex flex-col gap-2">
          <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Session notes</h2>
          <p className="rounded-2xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-fg">{workout.notes}</p>
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

function Stat({ label, value, unit = null, small = false }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-center">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span
        className={`max-w-full truncate font-bold tabular-nums text-fg ${
          small ? "pt-1 text-[16px] leading-snug" : "text-[22px] leading-tight tracking-[-0.01em]"
        }`}
      >
        {value}
        {unit ? <span className="ml-1 text-[13px] font-semibold tracking-normal text-muted">{unit}</span> : null}
      </span>
    </div>
  );
}

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}
