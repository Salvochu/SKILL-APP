import { Suspense } from "react";
import Link from "next/link";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getProgressData } from "@/lib/data/progress";
import { getProfile, getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import BarChart from "@/components/progress/BarChart";
import MesocycleSection from "@/components/dashboard/MesocycleSection";
import WorkoutHistoryModal from "@/components/dashboard/WorkoutHistoryModal";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-2">
      <Suspense fallback={<div className="h-8 w-40 rounded bg-surface" />}>
        <Greeting />
      </Suspense>

      <Suspense fallback={<div className="h-40 rounded-card bg-surface" />}>
        <MesocycleSection />
      </Suspense>

      <Suspense fallback={<div className="h-[4.5rem] rounded-card bg-surface" />}>
        <Streak />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<div className="h-52 rounded-card bg-surface" />}>
        <VolumeTrend />
      </Suspense>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Workout History</h2>
        <Suspense fallback={<div className="h-24 rounded-card bg-surface" />}>
          <Recent />
        </Suspense>
      </section>

      <QuickLink href="/body" title="Body measurements" body="Weight, body fat, photos" />
    </div>
  );
}

async function Greeting() {
  const profile = await getProfile();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || "";
  return (
    <h1 className="text-2xl font-bold text-fg">
      Welcome{firstName ? `, ${firstName}` : ""}
    </h1>
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

async function Streak() {
  const s = await getWorkoutSummary();
  const has = s.streakWeeks > 0;
  return (
    <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${has ? "bg-accent-soft" : "bg-surface-2"}`}>
        <IconFlame className={`h-6 w-6 ${has ? "text-accent" : "text-dim"}`} />
      </span>
      <div className="flex flex-col">
        <span className="tabular text-2xl font-bold text-fg">
          {s.streakWeeks} {s.streakWeeks === 1 ? "week" : "weeks"}
        </span>
        <span className="text-xs text-dim">
          {has
            ? s.longestStreakWeeks > s.streakWeeks
              ? `current streak . best ${s.longestStreakWeeks}`
              : "current streak"
            : "log a workout this week to start a streak"}
        </span>
      </div>
    </div>
  );
}

async function VolumeTrend() {
  const [{ sessionVolumes }, unit] = await Promise.all([getProgressData(), getUnitPreference()]);
  if (sessionVolumes.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">
        Log a workout to see your volume trend.
      </div>
    );
  }
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
        Training volume, recent sessions
      </h2>
      <BarChart
        data={sessionVolumes.map((v) => ({ ...v, volumeKg: Math.round(fromKg(v.volumeKg, unit)) }))}
        max={10}
        unit={unitLabel(unit)}
      />
    </section>
  );
}

async function Recent() {
  const s = await getWorkoutSummary();
  if (s.recent.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">
        No workouts yet. Log your first session.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
        {s.recent.map((w) => (
          <li key={w.id}>
            <Link
              href={`/workouts/${w.id}`}
              className="flex items-center justify-between gap-3 bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <span className="text-sm font-medium text-fg">{w.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-dim">
                {new Date(w.started_at).toLocaleDateString()}
                <IconChevron className="h-3.5 w-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {s.history.length > s.recent.length ? (
        <WorkoutHistoryModal sessions={s.history}>
          <button
            type="button"
            className="self-start rounded-field px-1 text-sm font-medium text-accent hover:text-accent-2"
          >
            Show all
          </button>
        </WorkoutHistoryModal>
      ) : null}
    </div>
  );
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
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="font-display text-base font-semibold text-fg">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </Link>
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

function IconFlame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c1 3-1 5-1 7a3 3 0 0 0 6 0c0-1 0-2-.5-3 2 2 3.5 4.5 3.5 7a8 8 0 0 1-16 0c0-4 3-6 4-9 .7-2 3-2 4 -2z" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
