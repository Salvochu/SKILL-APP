import { Suspense } from "react";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getWeeklyMuscleVolume } from "@/lib/data/volume";
import { getProfile, getUnitPreference } from "@/lib/data/profile";
import { getJourney } from "@/lib/data/journey";
import { fromKg, unitLabel } from "@/lib/units";
import TapLink from "@/components/TapLink";
import MesocycleSection from "@/components/dashboard/MesocycleSection";
import WeeklySetsMini from "@/components/dashboard/WeeklySetsMini";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex items-center justify-between gap-3">
        <Suspense fallback={<div className="h-8 w-40 rounded bg-surface" />}>
          <Greeting />
        </Suspense>
        <Suspense fallback={null}>
          <LevelChip />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-40 rounded-card bg-surface" />}>
        <MesocycleSection />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<div className="h-52 rounded-card bg-surface" />}>
        <WeeklySets />
      </Suspense>

      <QuickLink href="/body" title="Body measurements" body="Weight, body fat, photos" />
    </div>
  );
}

async function Greeting() {
  const profile = await getProfile();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || "";
  return (
    <h1 className="min-w-0 truncate text-2xl font-bold text-fg">
      Welcome{firstName ? `, ${firstName}` : ""}
    </h1>
  );
}

async function LevelChip() {
  const journey = await getJourney();
  if (!journey) return null;
  return (
    <TapLink
      href="/progress"
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
      style={{ color: journey.tierColor, borderColor: `${journey.tierColor}55` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: journey.tierColor }} />
      Lvl {journey.level}
    </TapLink>
  );
}

async function Stats() {
  const [s, unit] = await Promise.all([getWorkoutSummary(), getUnitPreference()]);
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Workouts" value={s.workouts} sub="all time" accent />
      <StatTile label="Total Sets" value={s.sets} sub="sets logged" />
      <StatTile
        label="Volume"
        value={`${(fromKg(s.volumeKg, unit) / 1000).toFixed(1)}k`}
        sub={`${unitLabel(unit)} lifted`}
      />
      <StatTile
        label="Time"
        value={`${Math.floor(s.minutes / 60)}h ${s.minutes % 60}m`}
        sub="training time"
      />
    </div>
  );
}

async function WeeklySets() {
  const data = await getWeeklyMuscleVolume();
  return <WeeklySetsMini data={data} />;
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-card border p-4 ${
        accent ? "border-accent bg-accent text-black" : "border-border bg-surface"
      }`}
    >
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-black/70" : "text-dim"}`}>
        {label}
      </span>
      <span className="tabular text-2xl font-bold">{value}</span>
      <span className={`text-xs ${accent ? "text-black/60" : "text-dim"}`}>{sub}</span>
    </div>
  );
}

function QuickLink({ href, title, body }) {
  return (
    <TapLink
      href={href}
      className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="font-display text-base font-semibold text-fg">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </TapLink>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-card bg-surface" />
      ))}
    </div>
  );
}

