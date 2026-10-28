import { Suspense } from "react";
import TapLink from "@/components/TapLink";
import ExportRow from "@/components/menu/ExportRow";
import { getIsCoach } from "@/lib/data/coach";
import { getMembership } from "@/lib/data/profile";
import { getChallengeAccess, getChallengeHistory } from "@/lib/data/challenge";

export const metadata = { title: "Menu" };

// Grouped like iPhone Settings. Each row keeps its own colour, shown as a
// solid rounded tile with a white symbol.
const TRAINING = [
  { href: "/progress", label: "Progress", body: "Strength and volume over time", icon: IconProgress, tint: "#1faa77" },
  { href: "/history", label: "Workout history", body: "Every session you have logged", icon: IconHistory, tint: "#cf8a1f" },
  { href: "/calendar", label: "Calendar", body: "Every training day, at a glance", icon: IconCalendar, tint: "#3987e5" },
  { href: "/body", label: "Body measurements", body: "Weight, body fat and photos", icon: IconBody, tint: "#d55181" },
];
const LEARN = [
  { href: "/library", label: "Library", body: "Exercises, stretching and lessons", icon: IconLibrary, tint: "#9085e9" },
];

const SUPPORT_EMAIL = "info@skfitness.uk";
const REPORT_ISSUE_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "SKILL app issue",
)}&body=${encodeURIComponent("What happened?\n\n\nWhat were you trying to do?\n\n")}`;

export default function MenuPage() {
  return (
    <div className="flex flex-col gap-7 py-2">
      <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Menu</h1>

      <Suspense fallback={null}>
        <CoachEntry />
      </Suspense>
      <Suspense fallback={null}>
        <WorkWithMeEntry />
      </Suspense>

      <MenuGroup title="Training">
        {TRAINING.map((it) => (
          <MenuLink key={it.href} {...it} />
        ))}
        <Suspense fallback={null}>
          <ChallengeHistoryRow />
        </Suspense>
      </MenuGroup>

      <MenuGroup title="Learn">
        {LEARN.map((it) => (
          <MenuLink key={it.href} {...it} />
        ))}
      </MenuGroup>

      <MenuGroup title="Your data">
        <ExportRow />
      </MenuGroup>

      <MenuGroup title="App">
        <MenuLink href="/settings" label="Settings" body="Notifications, rest timer, preferences" icon={IconGear} tint="#fc7605" />
        <MenuLink href={REPORT_ISSUE_HREF} external label="Report an issue" body="Found a bug? Let me know" icon={IconFlag} tint="#8e8780" />
      </MenuGroup>
    </div>
  );
}

// One section: a small header and a single rounded group. Rows draw their
// own hairline (inset past the icon, iOS style); the first row's is hidden.
function MenuGroup({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{title}</h2>
      <div className="overflow-hidden rounded-2xl bg-surface [&>:first-child_.menu-sep]:border-transparent">
        {children}
      </div>
    </section>
  );
}

function MenuLink({ href, label, body, icon, tint, external = false }) {
  const row = <MenuRow label={label} body={body} icon={icon} tint={tint} />;
  const cls = "block transition-colors hover:bg-surface-2 active:bg-surface-2";
  return external ? (
    <a href={href} className={cls}>
      {row}
    </a>
  ) : (
    <TapLink href={href} className={cls}>
      {row}
    </TapLink>
  );
}

async function CoachEntry() {
  if (!(await getIsCoach())) return null;
  return (
    <FeatureCard href="/clients" label="Clients" body="See who is training and progressing" icon={IconClients} />
  );
}

// Everyone who is not the coach gets the 1:1 upsell here - except an
// active challenge account before Day 14, same threshold as the VSL
// (components/challenge/VslCard.js): no early sales pitch before
// they've done the free 14 days.
async function WorkWithMeEntry() {
  if (await getIsCoach()) return null;
  if ((await getMembership()) === "challenge") {
    const access = await getChallengeAccess();
    if (!access.challengeDay || access.challengeDay < access.challengeDays) return null;
  }
  return (
    <FeatureCard href="/work-with-me" label="Work with Salvador" body="1:1 coaching, built around you" icon={IconCoach} />
  );
}

// The one highlighted card at the top (Clients for the coach, 1:1
// coaching for everyone else): an accent tile on a soft accent card.
function FeatureCard({ href, label, body, icon: Icon }) {
  return (
    <TapLink
      href={href}
      className="flex items-center gap-3.5 rounded-2xl bg-accent-soft p-4 transition-transform active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-black shadow-[0_8px_20px_-8px_rgba(252,118,5,0.7)]">
        <Icon className="h-[22px] w-[22px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{label}</span>
        <span className="truncate text-[13px] text-muted">{body}</span>
      </span>
      <IconChevron className="h-4 w-4 shrink-0 text-accent" />
    </TapLink>
  );
}

// Once someone has left the challenge tier (converted to a paying
// member, most commonly) but has a finished run behind them, this is
// where the climb, streak and checklist history they earned still live -
// the live /challenge tab is gone along with the "challenge" membership.
async function ChallengeHistoryRow() {
  if ((await getMembership()) === "challenge") return null;
  const history = await getChallengeHistory();
  if (!history.found) return null;
  return (
    <MenuLink
      href="/challenge/history"
      label="Your 14-Day Challenge"
      body="Your climb, streak and checklist history"
      icon={IconChallengeFlag}
      tint="#fc7605"
    />
  );
}

function IconChallengeFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 21V4" />
      <path d="M6 4h13l-3 4 3 4H6" />
      <circle cx="6" cy="21" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCoach(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7" r="3.25" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="m18 5 1.2 1.2L22 3.5" />
    </svg>
  );
}

function IconClients(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MenuRow({ label, body, icon: Icon, tint }) {
  return (
    <div className="flex items-center gap-3 pl-4">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white"
        style={{ backgroundColor: tint }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="menu-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] text-fg">{label}</span>
          <span className="truncate text-[13px] text-dim">{body}</span>
        </div>
        <IconChevron className="h-4 w-4 shrink-0 text-dim" />
      </div>
    </div>
  );
}

function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconProgress(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4v16h16" />
      <path d="m7 14 3.5-4 3 2.5L20 6" />
    </svg>
  );
}
function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconBody(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M4 7v3M20 7v3M4 17h16M4 17v-3M20 17v-3M9 12h6" />
    </svg>
  );
}
function IconLibrary(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconHistory(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 3v18" />
      <path d="M5 4h11l-2.5 4L16 12H5" />
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
