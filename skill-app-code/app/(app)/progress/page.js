import { Suspense } from "react";
import { getProgressData } from "@/lib/data/progress";
import { getWeeklyMuscleVolume } from "@/lib/data/volume";
import { getPersonalRecords } from "@/lib/data/prs";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import { compact, shortDate } from "@/components/progress/chartkit";
import BarChart from "@/components/progress/BarChart";
import StrengthChart from "@/components/progress/StrengthChart";
import CompareExercises from "@/components/progress/CompareExercises";
import MuscleVolume from "@/components/progress/MuscleVolume";
import PersonalRecords from "@/components/progress/PersonalRecords";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Progress</h1>
        <p className="text-sm text-muted">Track strength gains and training volume over time.</p>
      </header>
      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
        <ProgressBody />
      </Suspense>
    </div>
  );
}

async function ProgressBody() {
  const [rawData, muscleVolume, records, unit] = await Promise.all([
    getProgressData(),
    getWeeklyMuscleVolume(),
    getPersonalRecords(),
    getUnitPreference(),
  ]);

  if (rawData.workouts === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        No data yet. Log a workout to start tracking progress.
      </div>
    );
  }

  // Convert kg -> the user's unit once, so every chart and table below
  // just formats numbers. `compact()` handles the display rounding.
  const conv = (kg) => (kg == null ? kg : Math.round(fromKg(kg, unit)));
  const data = {
    ...rawData,
    totalVolumeKg: conv(rawData.totalVolumeKg),
    sessionVolumes: rawData.sessionVolumes.map((s) => ({ ...s, volumeKg: conv(s.volumeKg) })),
    exercises: rawData.exercises.map((e) => ({
      ...e,
      points: e.points.map((p) => ({
        ...p,
        best1rm: conv(p.best1rm),
        topWeight: Math.round(fromKg(p.topWeight, unit) * 10) / 10,
      })),
    })),
  };
  const U = unitLabel(unit);

  const strongExercises = data.exercises.filter((e) => e.points.length >= 2);
  const heaviest = data.exercises
    .flatMap((e) => e.points.map((p) => ({ name: e.name, ...p })))
    .sort((a, b) => b.best1rm - a.best1rm)[0];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Total volume" value={`${compact(data.totalVolumeKg)} ${U}`} />
        <Stat label="Workouts" value={data.workouts} />
        {heaviest ? <Stat label="Top est. 1RM" value={`${compact(heaviest.best1rm)} ${U}`} sub={heaviest.name} /> : null}
      </div>

      <Card title="Weekly sets by muscle" subtitle="Hard sets this week. Tap a group for the muscle breakdown">
        <MuscleVolume data={muscleVolume} />
      </Card>

      {records.length > 0 ? (
        <Card title="Personal records" subtitle="Your best estimated 1RM on each lift">
          <PersonalRecords records={records} unit={unit} />
        </Card>
      ) : null}

      <Card title="Training volume" subtitle={`Total ${U} lifted per session`}>
        <BarChart data={data.sessionVolumes} unit={U} />
        <DataTable
          headers={["Session", "Date", "Volume"]}
          rows={data.sessionVolumes.slice(-16).map((s) => [s.label, shortDate(s.date), `${compact(s.volumeKg)} ${U}`])}
        />
      </Card>

      {strongExercises.length > 0 ? (
        <Card title="Strength over time" subtitle="Estimated 1RM (Epley) from your best set">
          <StrengthChart exercises={data.exercises} unit={U} />
          <DataTable
            headers={["Exercise", "Sessions", "Latest est. 1RM"]}
            rows={strongExercises.map((e) => [
              e.name,
              String(e.points.length),
              `${compact(e.points.at(-1).best1rm)} ${U}`,
            ])}
          />
        </Card>
      ) : null}

      {strongExercises.length >= 2 ? (
        <Card title="Compare two lifts" subtitle="Pick any two lifts you have logged and see how each is going">
          <CompareExercises exercises={data.exercises} unit={U} />
        </Card>
      ) : null}
    </>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span className="text-2xl font-bold text-fg">{value}</span>
      {sub ? <span className="truncate text-xs text-dim">{sub}</span> : null}
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-base font-semibold text-fg">{title}</h2>
        <p className="text-xs text-dim">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs font-medium text-dim hover:text-fg">Show data</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-dim">
              {headers.map((h) => (
                <th key={h} className="py-1 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-muted">
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="py-1.5 pr-4">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
