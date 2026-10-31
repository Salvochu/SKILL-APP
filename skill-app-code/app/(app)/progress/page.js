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
import { formatVolumeShort, fromKg, unitLabel } from "@/lib/units";
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
import BackLink from "@/components/ui/BackLink";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Progress" };

export default function ProgressPage({ searchParams }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <BackLink />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Progress</h1>
        <Suspense fallback={<div className="h-5 w-60 rounded-full skeleton bg-surface-2" />}>
          <LifetimeStrip />
        </Suspense>
      </header>
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Lifetime totals that feed the level, kept as one quiet line under the
// page title (they used to sit inside the Level card).
async function LifetimeStrip() {
  const [summary, unit] = await Promise.all([getWorkoutSummary(), getUnitPreference()]);
  const volume = formatVolumeShort(fromKg(summary.volumeKg, unit));
  const h = Math.floor(summary.minutes / 60);
  const m = summary.minutes % 60;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-muted">
      <span>
        <span className="tabular font-semibold text-fg">{summary.workouts}</span> workout
        {summary.workouts === 1 ? "" : "s"}
      </span>
      <span className="text-dim" aria-hidden="true">·</span>
      <span>
        <span className="tabular font-semibold text-fg">{volume}</span> {unitLabel(unit)} lifted
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

  // Only a brand-new account gets the empty screen. Someone with history
  // whose chosen range happens to be empty still sees their level and
  // lifts, and the range filter to pick a different window.
  if (lifetime.workouts === 0) {
    return (
      <EmptyState
        icon={<IconChart className="h-6 w-6" />}
        title="Nothing to chart yet"
        body="Your level, strength and volume show up here after your first workout."
        action={{ href: "/splits", label: "Start a workout" }}
      />
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
  const lifetimeVolume = formatVolumeShort(fromKg(lifetime.volumeKg, unit));
  const lh = Math.floor(lifetime.minutes / 60);
  const lm = lifetime.minutes % 60;
  const shareStats = [
    ["Workouts", String(lifetime.workouts)],
    [`${U} lifted`, lifetimeVolume],
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
  const hasTrends = !beginner.simplified;
  const rangeEmpty = data.sessionVolumes.length === 0 && strongExercises.length === 0;

  // The share card is all about the level, so it lives in that card.
  const share = (
    <ShareProgress
      levelLabel={journey ? `Level ${journey.level}` : null}
      tierLabel={journey?.tier ?? null}
      tierColor={journey?.tierColor ?? null}
      xpPct={journey ? (journey.atMax ? 100 : journey.pctToNextLevel) : null}
      stats={shareStats}
      muscles={shareMuscles}
      caption={shareCaption}
    />
  );

  return (
    <div className="flex flex-col gap-3">
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
          <LevelCard journey={journey} footer={share} />
        </CollapsibleCard>
      ) : (
        share
      )}

      {strength && strength.covered > 0 ? (
        <CollapsibleCard
          title="Your lifts"
          aside={
            <span className="text-[15px] text-muted">
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
          <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Suspense fallback={<div className="h-8" />}>
              <RangeFilter mesoAvailable={Boolean(mesoRange)} />
            </Suspense>
            <p className="text-[13px] text-muted">
              Showing {range.sinceISO ? range.label : "all time"}
            </p>
          </div>

          {rangeEmpty ? (
            <p className="text-[15px] text-muted">No workouts in this range. Pick a longer one above.</p>
          ) : null}

          {data.sessionVolumes.length > 0 ? (
          <div className="flex flex-col gap-3">
            <ChartTitle title="Training volume" caption={`Total ${U} lifted per session`} />
            <BarChart data={data.sessionVolumes} unit={U} />
            <DataTable
              headers={["Session", "Date", "Volume"]}
              rows={data.sessionVolumes.slice(-16).map((s) => ({
                href: `/workouts/${s.id}`,
                cells: [s.label, shortDate(s.date), `${compact(s.volumeKg)} ${U}`],
              }))}
            />
          </div>
          ) : null}

          {strongExercises.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border/70 pt-5">
              <ChartTitle title="Strength over time" caption="Estimated 1RM (Epley) from your best set" />
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
            <div className="flex flex-col gap-3 border-t border-border/70 pt-5">
              <ChartTitle title="Compare two lifts" caption="Pick any two lifts you have logged and see how each is going" />
              <CompareExercises exercises={data.exercises} unit={U} />
            </div>
          ) : null}
          </div>
        </CollapsibleCard>
      ) : null}
    </div>
  );
}

// `rows` items are either a plain array of cells, or { href, cells } to
// make the whole row a link (first cell renders as the anchor).
function DataTable({ headers, rows }) {
  const norm = rows.map((r) => (Array.isArray(r) ? { href: null, cells: r } : r));
  const linked = norm.some((r) => r.href);
  return (
    <details className="group/data [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-lg py-1 text-[14px] font-semibold text-accent transition-opacity active:opacity-60">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-open/data:rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
        <span className="group-open/data:hidden">Show data</span>
        <span className="hidden group-open/data:inline">Hide data</span>
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="text-[12px] uppercase tracking-[0.04em] text-dim">
              {headers.map((h) => (
                <th key={h} className="py-1.5 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-muted tabular-nums">
            {norm.map((r, i) => (
              <tr key={i} className="border-t border-border/70 transition-colors hover:bg-surface-2">
                {r.cells.map((c, j) => (
                  <td key={j} className="py-2 pr-4">
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
          <p className="mt-2 text-[13px] text-dim">Tap a row to open it.</p>
        ) : null}
      </div>
    </details>
  );
}

function ChartTitle({ title, caption }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="font-sans text-[16px] font-semibold tracking-[-0.01em] text-fg">{title}</h3>
      <p className="text-[13px] text-muted">{caption}</p>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-44 rounded-2xl skeleton bg-surface-2" />
      <div className="h-16 rounded-2xl skeleton bg-surface-2" />
      <div className="h-16 rounded-2xl skeleton bg-surface-2" />
      <div className="h-16 rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}

function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M13 16V8M18 16v-6" />
    </svg>
  );
}
