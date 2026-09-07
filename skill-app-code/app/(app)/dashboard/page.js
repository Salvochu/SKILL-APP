import { Suspense } from "react";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getProfile, getUnitPreference } from "@/lib/data/profile";
import { getJourney } from "@/lib/data/journey";
import { fromKg, unitLabel } from "@/lib/units";
import TapLink from "@/components/TapLink";
import LevelBadge from "@/components/dashboard/LevelBadge";
import MesocycleSection from "@/components/dashboard/MesocycleSection";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7 py-2">
      <div className="flex flex-col gap-2">
        <Suspense fallback={<div className="h-8 w-48 rounded bg-surface" />}>
          <Greeting />
        </Suspense>
        <Suspense fallback={<div className="h-5 w-56 rounded bg-surface" />}>
          <HeaderStats />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-48 rounded-card bg-surface" />}>
        <MesocycleSection />
      </Suspense>

      <div className="grid grid-cols-2 gap-3">
        <QuickLink
          href="/body"
          title="Body measurements"
          body="Weight, body fat, photos"
          icon={<IconBody className="h-5 w-5" />}
        />
        <QuickLink
          href="/progress"
          title="Progress"
          body="Level, lifts, trends"
          icon={<IconChart className="h-5 w-5" />}
        />
      </div>
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

// One quiet line under the greeting: where you are, and the two lifetime
// totals worth glancing at. Taps through to the full Progress page.
async function HeaderStats() {
  const [s, journey, unit] = await Promise.all([
    getWorkoutSummary(),
    getJourney(),
    getUnitPreference(),
  ]);
  const volK = (fromKg(s.volumeKg, unit) / 1000).toFixed(1);

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted">
      {journey ? <LevelBadge journey={journey} /> : null}
      <TapLink
        href="/progress"
        className="flex flex-wrap items-center gap-x-2.5 transition-colors hover:text-fg"
      >
        <span>
          <span className="tabular font-semibold text-fg">{s.workouts}</span> workout
          {s.workouts === 1 ? "" : "s"}
        </span>
        <span className="text-dim" aria-hidden="true">·</span>
        <span>
          <span className="tabular font-semibold text-fg">{volK}k</span> {unitLabel(unit)} lifted
        </span>
      </TapLink>
    </div>
  );
}

function QuickLink({ href, title, body, icon }) {
  return (
    <TapLink
      href={href}
      className="flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      {icon ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          {icon}
        </span>
      ) : null}
      <span className="font-display text-base font-semibold text-fg">{title}</span>
      <span className="text-sm text-muted">{body}</span>
    </TapLink>
  );
}

function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M13 16V8M18 16v-6" />
    </svg>
  );
}
function IconBody(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 9v7M12 12l-4 2M12 12l4 2M12 16l-2.5 5M12 16l2.5 5" />
    </svg>
  );
}
