import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseById } from "@/lib/data/exercises";
import { getExerciseHistory } from "@/lib/data/exerciseHistory";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import { shortDate } from "@/components/progress/chartkit";
import MusclePill from "@/components/MusclePill";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const exercise = await getExerciseById(id);
  return { title: exercise ? `${exercise.name} history` : "Exercise history" };
}

export default async function ExerciseHistoryPage({ params }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/library/exercises"
        className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
        Exercise Library
      </Link>
      <Suspense fallback={<HistorySkeleton />}>
        <Body id={id} />
      </Suspense>
    </div>
  );
}

async function Body({ id }) {
  const [exercise, history, unit] = await Promise.all([
    getExerciseById(id),
    getExerciseHistory(id, { limit: null }),
    getUnitPreference(),
  ]);
  if (!exercise) notFound();

  const U = unitLabel(unit);
  const conv = (kg) => (kg == null ? null : unit === "kg" ? Math.round(kg) : Math.round(fromKg(kg, unit)));
  const convW = (kg) => (kg == null ? null : unit === "kg" ? kg : Math.round(fromKg(kg, unit) * 10) / 10);

  const primary = (exercise.muscles ?? []).filter((m) => m.role === "primary");

  return (
    <>
      <header className="flex flex-col gap-2.5">
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          {exercise.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {primary.length
            ? primary.map((m) => <MusclePill key={m.id} muscle={m.name} />)
            : exercise.muscle
              ? <MusclePill muscle={exercise.muscle} />
              : null}
          {exercise.equipment ? (
            <span className="rounded-full bg-fg/10 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
              {exercise.equipment}
            </span>
          ) : null}
        </div>
      </header>

      {history.count === 0 ? (
        <div className="rounded-2xl bg-surface px-6 py-10 text-center text-[15px] text-muted">
          You have not logged this exercise yet.
        </div>
      ) : (
        <>
          {/* One summary strip, same as a workout's detail page. */}
          <div className="grid grid-cols-3 rounded-2xl bg-surface py-4 [&>*+*]:border-l [&>*+*]:border-border/70">
            <Stat label="Sessions" value={history.count} />
            <Stat label="Best est. 1RM" value={conv(history.best1rmKg)} unit={U} />
            <Stat label="Top weight" value={convW(history.topWeightKg)} unit={U} />
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Every session</h2>
            <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
              {history.sessions.map((s) => {
                const sets = s.sets.filter((x) => x.weight != null || x.reps != null);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/workouts/${s.id}`}
                      className="flex pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2"
                    >
                      <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
                        <span className="flex min-w-0 flex-1 flex-col gap-2">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-[16px] font-semibold text-fg">{shortDate(s.date.slice(0, 10))}</span>
                            {s.best1rmKg > 0 ? (
                              <span className="tabular shrink-0 text-[13px] text-muted">
                                est. 1RM <span className="font-semibold text-fg">{conv(s.best1rmKg)} {U}</span>
                              </span>
                            ) : null}
                          </span>
                          {sets.length ? (
                            <span className="flex flex-wrap gap-1.5">
                              {sets.map((x, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-fg/[0.08] px-2.5 py-1 text-[13px] font-semibold tabular-nums text-fg"
                                >
                                  {convW(x.weight) ?? "-"} x {x.reps ?? "-"}
                                  {x.rir != null ? <span className="font-medium text-muted"> @{x.rir}</span> : null}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </span>
                        <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

function Stat({ label, value, unit = null }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-center">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="max-w-full truncate text-[22px] font-bold leading-tight tracking-[-0.01em] text-fg tabular-nums">
        {value ?? "n/a"}
        {unit && value != null ? <span className="ml-1 text-[13px] font-semibold tracking-normal text-muted">{unit}</span> : null}
      </span>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="h-9 w-2/3 rounded-lg skeleton bg-surface-2" />
        <div className="h-6 w-40 rounded-full skeleton bg-surface-2" />
      </div>
      <div className="h-20 w-full rounded-2xl skeleton bg-surface-2" />
      <div className="h-72 w-full rounded-2xl skeleton bg-surface-2" />
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
