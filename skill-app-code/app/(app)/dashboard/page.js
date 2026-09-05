import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getProgressData } from "@/lib/data/progress";
import BarChart from "@/components/progress/BarChart";
import { signOut } from "@/app/actions";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-2">
      <Hero />

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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Recent</h2>
        <Suspense fallback={<div className="h-24 rounded-card bg-surface" />}>
          <Recent />
        </Suspense>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/log" title="Log Workout" body="Record sets, reps and weight" />
        <QuickLink href="/library" title="Exercise Library" body="63 movements with videos" />
        <QuickLink href="/splits" title="Training Splits" body="Full Gym, dumbbell and bodyweight" />
      </section>

      <Suspense fallback={null}>
        <AccountRow />
      </Suspense>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/60 px-3 py-1 text-xs font-semibold text-muted">
        <IconFlame className="h-3.5 w-3.5 text-accent" />
        Train. Track. Improve.
      </span>
      <h1 className="mt-4 max-w-sm text-3xl font-extrabold leading-tight text-fg">
        Your training, <span className="text-accent">measured.</span>
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Log every rep, browse the exercise library, and watch your strength climb on
        the progress charts.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/log"
          className="flex items-center justify-center gap-1.5 rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
        >
          <IconPlus className="h-4 w-4" />
          Log a Workout
        </Link>
        <Link
          href="/library"
          className="flex items-center justify-center rounded-field border border-border px-4 py-2.5 font-medium text-fg transition-colors hover:bg-surface-2"
        >
          Browse Library
        </Link>
      </div>
    </div>
  );
}

async function Stats() {
  const s = await getWorkoutSummary();
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Workouts" value={s.workouts} sub="all time" accent />
      <StatTile label="Total Sets" value={s.sets} sub="sets logged" />
      <StatTile
        label="Volume"
        value={`${(s.volumeKg / 1000).toFixed(1)}k`}
        sub="kg lifted"
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
  const { sessionVolumes } = await getProgressData();
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
      <BarChart data={sessionVolumes} max={10} />
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
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
      {s.recent.map((w) => (
        <li key={w.id} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
          <span className="text-sm font-medium text-fg">{w.title}</span>
          <span className="text-xs text-dim">
            {new Date(w.started_at).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

async function AccountRow() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
      <span className="text-dim">{user.email}</span>
      <form action={signOut}>
        <button type="submit" className="font-medium text-muted transition-colors hover:text-fg">
          Sign out
        </button>
      </form>
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
function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
