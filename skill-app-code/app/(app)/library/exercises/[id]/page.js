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
      <header className="flex flex-col gap-1">
        <Link href="/library/exercises" className="flex items-center gap-1 text-xs font-medium text-dim hover:text-fg">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Exercise Library
        </Link>
      </header>
      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2">
          {primary.length
            ? primary.map((m) => <MusclePill key={m.id} muscle={m.name} />)
            : exercise.muscle
              ? <MusclePill muscle={exercise.muscle} />
              : null}
          {exercise.equipment ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
              {exercise.equipment}
            </span>
          ) : null}
        </div>
      </div>

      {history.count === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          You have not logged this exercise yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sessions" value={history.count} />
            <Stat label="Best est. 1RM" value={`${conv(history.best1rmKg)} ${U}`} />
            <Stat label="Top weight" value={`${convW(history.topWeightKg)} ${U}`} />
          </div>

          <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Every session</h2>
            <ul className="flex flex-col gap-2">
              {history.sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/workouts/${s.id}`}
                    className="flex flex-col gap-1 rounded-field border border-border bg-bg/40 p-3 transition-colors hover:border-border-strong active:bg-accent-soft"
                  >
                    <span className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-fg">{shortDate(s.date.slice(0, 10))}</span>
                      {s.best1rmKg > 0 ? (
                        <span className="tabular text-dim">est. 1RM {conv(s.best1rmKg)} {U}</span>
                      ) : null}
                    </span>
                    <span className="tabular text-sm text-muted">
                      {s.sets
                        .filter((x) => x.weight != null || x.reps != null)
                        .map((x) => `${convW(x.weight) ?? "-"} x ${x.reps ?? "-"}${x.rir != null ? ` @${x.rir}` : ""}`)
                        .join("   .   ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span className="tabular text-lg font-bold text-fg">{value}</span>
    </div>
  );
}
