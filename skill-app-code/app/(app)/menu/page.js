import { Suspense } from "react";
import Link from "next/link";
import { getAllWorkoutSessions } from "@/lib/data/workouts";
import WorkoutHistoryModal from "@/components/dashboard/WorkoutHistoryModal";

export const metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header>
        <h1 className="text-2xl font-bold text-fg">Menu</h1>
      </header>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border">
        <MenuLink href="/profile" label="Profile" body="Your details and account" icon={IconUser} />
        <MenuLink href="/progress" label="Progress" body="Strength and volume over time" icon={IconProgress} />
        <MenuLink href="/body" label="Body" body="Weight and measurements" icon={IconBody} />
        <MenuLink href="/library" label="Library" body="Exercises, stretching and lessons" icon={IconLibrary} />
        <Suspense fallback={<MenuRowSkeleton />}>
          <WorkoutHistoryRow />
        </Suspense>
        <a href="/api/export" className="block transition-colors hover:bg-surface-2">
          <MenuRow
            label="Export training log"
            body="Download every set you have logged as a CSV"
            icon={IconDownload}
          />
        </a>
      </div>
    </div>
  );
}

async function WorkoutHistoryRow() {
  const sessions = await getAllWorkoutSessions();
  return (
    <WorkoutHistoryModal sessions={sessions}>
      <button type="button" className="w-full text-left">
        <MenuRow label="Workout History" body="Every session you have logged" icon={IconHistory} />
      </button>
    </WorkoutHistoryModal>
  );
}

function MenuLink({ href, label, body, icon }) {
  return (
    <Link href={href} className="block transition-colors hover:bg-surface-2">
      <MenuRow label={label} body={body} icon={icon} />
    </Link>
  );
}

function MenuRow({ label, body, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
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

function MenuRowSkeleton() {
  return <div className="h-[62px] bg-surface" />;
}

function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
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
function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
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
