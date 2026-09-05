import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { formatSet, EFFORT_LABELS } from "@/lib/training";
import MusclePill from "@/components/MusclePill";
import LoggedAt from "@/components/LoggedAt";
import DeleteWorkoutButton from "@/components/workouts/DeleteWorkoutButton";

export const metadata = { title: "Workout" };

// Reads the dynamic [id] param directly with no useful static shell (a
// past session's detail is entirely per-request, per-user data), same
// reasoning as app/(app)/log/page.js.
export const instant = false;

export default async function WorkoutDetailPage({ params }) {
  const { id } = await params;
  const workout = await getWorkoutDetail(id);
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
          <span className="tabular text-2xl font-bold text-fg">{workout.volumeKg} kg</span>
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

      {workout.exercises.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
          No sets were logged for this session.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {workout.exercises.map((ex) => (
            <section key={ex.exercise?.id ?? ex.note} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-fg">{ex.exercise?.name ?? "Exercise"}</span>
                {ex.exercise?.muscle ? <MusclePill muscle={ex.exercise.muscle} /> : null}
              </div>
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
                {ex.sets.map((s) => (
                  <li
                    key={s.setNumber}
                    className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${
                      s.completed ? "bg-accent-soft text-fg" : "bg-bg/40 text-dim"
                    }`}
                  >
                    <span className="text-dim">Set {s.setNumber}</span>
                    <span className="tabular">{formatSet(s)}</span>
                    {!s.completed ? <span className="text-xs">not completed</span> : null}
                  </li>
                ))}
              </ul>
              {ex.note ? <p className="text-sm text-muted">{ex.note}</p> : null}
            </section>
          ))}
        </div>
      )}

      {workout.notes ? (
        <section className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Session notes</h2>
          <p className="text-sm text-muted">{workout.notes}</p>
        </section>
      ) : null}

      <DeleteWorkoutButton sessionId={workout.id} />
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
