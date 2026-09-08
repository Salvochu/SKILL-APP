import { Suspense } from "react";
import TapLink from "@/components/TapLink";
import ExportRow from "@/components/menu/ExportRow";
import { getIsCoach } from "@/lib/data/coach";

export const metadata = { title: "Menu" };

const ITEMS = [
  { href: "/progress", label: "Progress", body: "Strength and volume over time", icon: IconProgress, tint: "#1faa77" },
  { href: "/body", label: "Body measurements", body: "Weight, body fat and photos", icon: IconBody, tint: "#d55181" },
  { href: "/library", label: "Library", body: "Exercises, stretching and lessons", icon: IconLibrary, tint: "#9085e9" },
  { href: "/calendar", label: "Calendar", body: "Every training day, at a glance", icon: IconCalendar, tint: "#3987e5" },
  { href: "/history", label: "Workout History", body: "Every session you have logged", icon: IconHistory, tint: "#cf8a1f" },
];

const SETTINGS = {
  href: "/settings",
  label: "Settings",
  body: "Notifications, rest timer, preferences",
  icon: IconGear,
  tint: "#fc7605",
};

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header>
        <h1 className="text-2xl font-bold text-fg">Menu</h1>
      </header>

      <Suspense fallback={null}>
        <CoachEntry />
      </Suspense>
      <Suspense fallback={null}>
        <WorkWithMeEntry />
      </Suspense>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
        {ITEMS.map((it) => (
          <TapLink key={it.href} href={it.href} className="block transition-colors hover:bg-surface-2">
            <MenuRow label={it.label} body={it.body} icon={it.icon} tint={it.tint} />
          </TapLink>
        ))}
        <ExportRow />
        <TapLink href={SETTINGS.href} className="block transition-colors hover:bg-surface-2">
          <MenuRow label={SETTINGS.label} body={SETTINGS.body} icon={SETTINGS.icon} tint={SETTINGS.tint} />
        </TapLink>
      </div>
    </div>
  );
}

async function CoachEntry() {
  if (!(await getIsCoach())) return null;
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-accent/40">
      <TapLink href="/clients" className="block bg-accent-soft transition-colors hover:bg-accent-soft/70">
        <MenuRow
          label="Clients"
          body="See who is training and progressing"
          icon={IconClients}
          tint="#fc7605"
        />
      </TapLink>
    </div>
  );
}

// Everyone who is not the coach gets the 1:1 upsell here.
async function WorkWithMeEntry() {
  if (await getIsCoach()) return null;
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-accent/40">
      <TapLink href="/work-with-me" className="block bg-accent-soft transition-colors hover:bg-accent-soft/70">
        <MenuRow
          label="Work with Salvador"
          body="1:1 coaching, built around you"
          icon={IconCoach}
          tint="#fc7605"
        />
      </TapLink>
    </div>
  );
}

function IconCoach(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7" r="3.25" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="m18 5 1.2 1.2L22 3.5" />
    </svg>
  );
}

function IconClients(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MenuRow({ label, body, icon: Icon, tint }) {
  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          color: tint,
          backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span className="truncate text-xs text-dim">{body}</span>
      </div>
      <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
    </div>
  );
}

function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconProgress(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4v16h16" />
      <path d="m7 14 3.5-4 3 2.5L20 6" />
    </svg>
  );
}
function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconBody(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M4 7v3M20 7v3M4 17h16M4 17v-3M20 17v-3M9 12h6" />
    </svg>
  );
}
function IconLibrary(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconHistory(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
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
