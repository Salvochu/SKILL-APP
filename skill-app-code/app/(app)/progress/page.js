import { Suspense } from "react";
import { getProgressData } from "@/lib/data/progress";
import { getWeeklyMuscleVolume } from "@/lib/data/volume";
import { getPersonalRecords } from "@/lib/data/prs";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import { parseRange } from "@/lib/dateRange";
import { compact, shortDate } from "@/components/progress/chartkit";
import BarChart from "@/components/progress/BarChart";
import StrengthChart from "@/components/progress/StrengthChart";
import CompareExercises from "@/components/progress/CompareExercises";
import MuscleVolume from "@/components/progress/MuscleVolume";
import PersonalRecords from "@/components/progress/PersonalRecords";
import RangeFilter from "@/components/progress/RangeFilter";
import ShareProgress from "@/components/progress/ShareProgress";

export const metadata = { title: "Progress" };

export default function ProgressPage({ searchParams }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Progress</h1>
        <p className="text-sm text-muted">Strength and volume over time.</p>
      </header>
      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
        <ProgressBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProgressBody({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const range = parseRange(sp.range);

  const [rawData, muscleVolume, records, summary, unit] = await Promise.all([
    getProgressData(range),
    getWeeklyMuscleVolume(),
    getPersonalRecords(),
    getWorkoutSummary(),
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

  // Headline "top 1RM" is all-time, from the PR list (not the trimmed range).
  const topPR = records.reduce((a, b) => (b.best1rm > (a?.best1rm ?? 0) ? b : a), null);
  const topPRValue = topPR ? conv(topPR.best1rm) : null;

  const shareStats = [
    ["Total volume", `${compact(data.totalVolumeKg)} ${U}`],
    ["Workouts", String(data.workouts)],
  ];
  if (topPRValue) shareStats.push(["Top est. 1RM", `${compact(topPRValue)} ${U}`]);
  const shareMuscles = [...muscleVolume.groups]
    .flatMap((g) => g.muscles)
    .filter((m) => m.thisWeek > 0)
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .slice(0, 6)
    .map((m) => ({ name: m.muscle.replace(/\s*\(.*\)$/, ""), value: m.thisWeek }));

  const hasTrends = strongExercises.length > 0 || data.sessionVolumes.length > 0;

  return (
    <>
      <div className="flex justify-end">
        <ShareProgress stats={shareStats} muscles={shareMuscles} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total volume" value={`${compact(data.totalVolumeKg)} ${U}`} />
        <Stat label="Workouts" value={data.workouts} />
        <Stat label="Time" value={`${Math.floor(summary.minutes / 60)}h ${summary.minutes % 60}m`} />
        {topPRValue ? <Stat label="Top est. 1RM" value={`${compact(topPRValue)} ${U}`} sub={topPR.name} /> : null}
      </div>

      <Card title="Weekly sets by muscle" subtitle="Hard sets this week. Tap a group to see each muscle">
        <MuscleVolume data={muscleVolume} />
      </Card>

      {records.length > 0 ? (
        <Card title="Personal records" subtitle="Your best estimated 1RM on each lift, all time">
          <PersonalRecords records={records} unit={unit} />
        </Card>
      ) : null}

      {hasTrends ? (
        <details className="group flex flex-col rounded-card border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex flex-col">
              <span className="font-display text-base font-semibold text-fg">Trends</span>
              <span className="text-xs text-dim">Volume and strength over time</span>
            </span>
            <IconChevron className="h-4 w-4 text-dim transition-transform group-open:rotate-90" />
          </summary>

          <div className="flex flex-col gap-4 border-t border-border p-4">
          <div className="flex flex-col gap-2">
            <Suspense fallback={<div className="h-8" />}>
              <RangeFilter />
            </Suspense>
            <p className="text-xs text-dim">
              Showing {range.sinceISO ? range.label : "all time"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-fg">Training volume</h3>
            <p className="text-xs text-dim">Total {U} lifted per session</p>
            <BarChart data={data.sessionVolumes} unit={U} />
            <DataTable
              headers={["Session", "Date", "Volume"]}
              rows={data.sessionVolumes.slice(-16).map((s) => [s.label, shortDate(s.date), `${compact(s.volumeKg)} ${U}`])}
            />
          </div>

          {strongExercises.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-fg">Strength over time</h3>
              <p className="text-xs text-dim">Estimated 1RM (Epley) from your best set</p>
              <StrengthChart exercises={data.exercises} unit={U} />
              <DataTable
                headers={["Exercise", "Sessions", "Latest est. 1RM"]}
                rows={strongExercises.map((e) => [
                  e.name,
                  String(e.points.length),
                  `${compact(e.points.at(-1).best1rm)} ${U}`,
                ])}
              />
            </div>
          ) : null}

          {strongExercises.length >= 2 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-fg">Compare two lifts</h3>
              <p className="text-xs text-dim">Pick any two lifts you have logged and see how each is going</p>
              <CompareExercises exercises={data.exercises} unit={U} />
            </div>
          ) : null}
          </div>
        </details>
      ) : null}
    </>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
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
