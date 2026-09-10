import { Suspense } from "react";
import Link from "next/link";
import { getProgressData } from "@/lib/data/progress";
import { getWeeklyMuscleVolume, getMuscleTrainingTotals } from "@/lib/data/volume";
import { getPersonalRecords } from "@/lib/data/prs";
import { getStrengthScore, getLastStrengthCheck } from "@/lib/data/strength";
import { getJourney } from "@/lib/data/journey";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getUnitPreference, getBeginnerContext } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import { parseRange, resolveMesoRange, MESO_TOKEN } from "@/lib/dateRange";
import { compact, shortDate } from "@/components/progress/chartkit";
import BarChart from "@/components/progress/BarChart";
import StrengthChart from "@/components/progress/StrengthChart";
import CompareExercises from "@/components/progress/CompareExercises";
import MuscleVolume from "@/components/progress/MuscleVolume";
import StrengthCard from "@/components/progress/StrengthCard";
import LevelCard from "@/components/progress/LevelCard";
import CollapsibleCard from "@/components/progress/CollapsibleCard";
import RangeFilter from "@/components/progress/RangeFilter";
import ShareProgress from "@/components/progress/ShareProgress";

export const metadata = { title: "Progress" };

export default function ProgressPage({ searchParams }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-fg">Progress</h1>
        <Suspense fallback={<div className="h-5 w-52 rounded skeleton bg-surface-2" />}>
          <LifetimeStrip />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-64 rounded-card skeleton bg-surface-2" />}>
        <ProgressBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Lifetime totals that feed the level, kept as one quiet line under the
// page title (they used to sit inside the Level card).
async function LifetimeStrip() {
  const [summary, unit] = await Promise.all([getWorkoutSummary(), getUnitPreference()]);
  const volK = (fromKg(summary.volumeKg, unit) / 1000).toFixed(1);
  const h = Math.floor(summary.minutes / 60);
  const m = summary.minutes % 60;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted">
      <span>
        <span className="tabular font-semibold text-fg">{summary.workouts}</span> workout
        {summary.workouts === 1 ? "" : "s"}
      </span>
      <span className="text-dim" aria-hidden="true">·</span>
      <span>
        <span className="tabular font-semibold text-fg">{volK}k</span> {unitLabel(unit)} lifted
      </span>
      <span className="text-dim" aria-hidden="true">·</span>
      <span>
        <span className="tabular font-semibold text-fg">
          {h > 0 ? `${h}h ` : ""}
          {m}m
        </span>{" "}
        trained
      </span>
    </div>
  );
}

async function ProgressBody({ searchParams }) {
  const sp = (await searchParams) ?? {};

  const activeMeso = await getActiveMesocycle();
  const mesoRange = resolveMesoRange(activeMeso?.startDate);
  const range = sp.range === MESO_TOKEN && mesoRange ? mesoRange : parseRange(sp.range);

  const [rawData, muscleVolume, records, strength, journey, lastCheck, beginner, unit, lifetime, muscleTotals] =
    await Promise.all([
      getProgressData(range),
      getWeeklyMuscleVolume(),
      getPersonalRecords(),
      getStrengthScore(),
      getJourney(),
      getLastStrengthCheck(),
      getBeginnerContext(),
      getUnitPreference(),
      getWorkoutSummary(),
      getMuscleTrainingTotals(),
    ]);
  const showStrengthCheck = beginner.showStrengthCheck;

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

  // The share card is a lifetime identity card (level, rank, totals,
  // strongest lifts), not a snapshot of the current filter range.
  const lifetimeVolK = (fromKg(lifetime.volumeKg, unit) / 1000).toFixed(1);
  const lh = Math.floor(lifetime.minutes / 60);
  const lm = lifetime.minutes % 60;
  const shareStats = [
    ["Workouts", String(lifetime.workouts)],
    [`${U} lifted`, `${lifetimeVolK}k`],
    ["Trained", lh > 0 ? `${lh}h` : `${lm}m`],
  ];
  const shareMuscles = muscleTotals
    .slice(0, 4)
    .map((g) => ({ name: g.label, sets: g.sets, parent: g.parent }));
  const shareCaption = journey
    ? `${journey.tier}, Level ${journey.level} on SKILL. Tracked with @salvador_skfitness`
    : "My training progress on SKILL. Tracked with @salvador_skfitness";

  // The trend charts (per-session volume, estimated 1RM over time,
  // compare-two-lifts) need a few weeks of data to be worth reading and
  // lean on concepts a new beginner has not met yet.
  const hasTrends =
    !beginner.simplified && (strongExercises.length > 0 || data.sessionVolumes.length > 0);

  return (
    <>
      <div className="flex justify-end">
        <ShareProgress
          levelLabel={journey ? `Level ${journey.level}` : null}
          tierLabel={journey?.tier ?? null}
          tierColor={journey?.tierColor ?? null}
          xpPct={journey ? (journey.atMax ? 100 : journey.pctToNextLevel) : null}
          stats={shareStats}
          muscles={shareMuscles}
          caption={shareCaption}
        />
      </div>

      {journey ? (
        <CollapsibleCard
          title="Level"
          defaultOpen
          aside={
            <span className="font-semibold" style={{ color: journey.tierColor }}>
              {journey.tier} · {journey.level}
            </span>
          }
        >
          <LevelCard journey={journey} />
        </CollapsibleCard>
      ) : null}

      {strength && strength.covered > 0 ? (
        <CollapsibleCard
          title="Your lifts"
          aside={
            <span className="text-xs text-dim">
              {strength.covered} of 6 {showStrengthCheck ? "tested" : "trained"}
            </span>
          }
        >
          <StrengthCard
            strength={strength}
            records={records}
            unit={unit}
            lastCheck={lastCheck}
            showStrengthCheck={showStrengthCheck}
          />
        </CollapsibleCard>
      ) : showStrengthCheck ? (
        <StrengthCard
          strength={strength}
          records={records}
          unit={unit}
          lastCheck={lastCheck}
          showStrengthCheck
        />
      ) : null}

      <CollapsibleCard title="Weekly sets by muscle">
        <MuscleVolume data={muscleVolume} />
      </CollapsibleCard>

      {hasTrends ? (
        <CollapsibleCard title="Trends">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Suspense fallback={<div className="h-8" />}>
              <RangeFilter mesoAvailable={Boolean(mesoRange)} />
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
              rows={data.sessionVolumes.slice(-16).map((s) => ({
                href: `/workouts/${s.id}`,
                cells: [s.label, shortDate(s.date), `${compact(s.volumeKg)} ${U}`],
              }))}
            />
          </div>

          {strongExercises.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-fg">Strength over time</h3>
              <p className="text-xs text-dim">Estimated 1RM (Epley) from your best set</p>
              <StrengthChart exercises={data.exercises} unit={U} />
              <DataTable
                headers={["Exercise", "Sessions", "Latest est. 1RM"]}
                rows={strongExercises.map((e) => ({
                  href: `/library/exercises/${e.id}`,
                  cells: [e.name, String(e.points.length), `${compact(e.points.at(-1).best1rm)} ${U}`],
                }))}
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
        </CollapsibleCard>
      ) : null}
    </>
  );
}

// `rows` items are either a plain array of cells, or { href, cells } to
// make the whole row a link (first cell renders as the anchor).
function DataTable({ headers, rows }) {
  const norm = rows.map((r) => (Array.isArray(r) ? { href: null, cells: r } : r));
  const linked = norm.some((r) => r.href);
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
            {norm.map((r, i) => (
              <tr key={i} className="border-t border-border transition-colors hover:bg-surface-2">
                {r.cells.map((c, j) => (
                  <td key={j} className="py-1.5 pr-4">
                    {j === 0 && r.href ? (
                      <Link href={r.href} className="font-medium text-fg hover:text-accent hover:underline">
                        {c}
                      </Link>
                    ) : (
                      c
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {linked ? (
          <p className="mt-1.5 text-[11px] text-dim">Tap a row to open it.</p>
        ) : null}
      </div>
    </details>
  );
}
