import { Suspense } from "react";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getProfile, getUnitPreference } from "@/lib/data/profile";
import { getJourney } from "@/lib/data/journey";
import { getBodyLog } from "@/lib/data/body";
import { formatVolumeShort, fromKg, unitLabel } from "@/lib/units";
import TodayLabel from "@/components/dashboard/TodayLabel";
import TapLink from "@/components/TapLink";
import LevelBadge from "@/components/dashboard/LevelBadge";
import MesocycleSection from "@/components/dashboard/MesocycleSection";
import MembershipEndingBanner from "@/components/membership/MembershipEndingBanner";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7 py-2">
      <header className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <TodayLabel />
          <Suspense fallback={<div className="h-9 w-56 rounded-lg skeleton bg-surface-2" />}>
            <Greeting />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-6 w-60 rounded-full skeleton bg-surface-2" />}>
          <HeaderStats />
        </Suspense>
      </header>

      <Suspense fallback={null}>
        <MembershipEndingBanner />
      </Suspense>

      <Suspense fallback={<div className="h-72 rounded-2xl skeleton bg-surface-2" />}>
        <MesocycleSection />
      </Suspense>

      {/* Same tinted tiles as these two rows in the Menu. */}
      <div className="grid grid-cols-2 gap-3">
        <Suspense fallback={<BodyLink />}>
          <BodyTile />
        </Suspense>
        <QuickLink
          href="/progress"
          title="Progress"
          body="Level, lifts, trends"
          icon={<IconChart className="h-[18px] w-[18px]" />}
          tint="#1faa77"
        />
      </div>
    </div>
  );
}

// Names typed in all capitals ("MADARA") read as shouting in a large
// title, so those get a capital first letter only. Anything with its own
// mixed casing (McKenzie, de Souza) is left exactly as typed.
function displayName(word) {
  if (word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase()) {
    return word[0] + word.slice(1).toLowerCase();
  }
  return word;
}

async function Greeting() {
  const profile = await getProfile();
  const firstName = displayName(profile?.fullName?.trim().split(/\s+/)[0] || "");
  return (
    <h1 className="min-w-0 truncate font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
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
  const volume = formatVolumeShort(fromKg(s.volumeKg, unit));

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[15px] text-muted">
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
          <span className="tabular font-semibold text-fg">{volume}</span> {unitLabel(unit)} lifted
        </span>
      </TapLink>
    </div>
  );
}

// The Body tile shows the latest weigh-in once there is one, so the
// dashboard answers "where am I at" without a tap.
async function BodyTile() {
  const [{ entries }, unit] = await Promise.all([getBodyLog(), getUnitPreference()]);
  const lastWeight = entries.findLast((e) => e.weight != null)?.weight ?? null;
  if (lastWeight == null) return <BodyLink />;
  const shown = Math.round(fromKg(lastWeight, unit) * 10) / 10;
  return <BodyLink body={`Latest ${shown} ${unitLabel(unit)}`} />;
}

function BodyLink({ body = "Weight and photos" }) {
  return (
    <QuickLink
      href="/body"
      title="Body"
      body={body}
      icon={<IconBody className="h-[18px] w-[18px]" />}
      tint="#d55181"
    />
  );
}

function QuickLink({ href, title, body, icon, tint }) {
  return (
    <TapLink
      href={href}
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4 transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.98]"
    >
      <span className="flex items-center justify-between">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[9px] text-white"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </span>
        <IconChevron className="h-4 w-4 text-dim" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-fg">{title}</span>
        <span className="truncate text-[13px] leading-snug tabular-nums text-muted">{body}</span>
      </span>
    </TapLink>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
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
function IconBody(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 9v7M12 12l-4 2M12 12l4 2M12 16l-2.5 5M12 16l2.5 5" />
    </svg>
  );
}
