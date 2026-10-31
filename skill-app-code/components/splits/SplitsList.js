import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import FoundationsCard from "@/components/splits/FoundationsCard";
import MyWorkoutsSection from "@/components/splits/MyWorkoutsSection";

const SECTION_LABEL = { primary: "Choose your split", coached: "Specialization programs" };

// The Train landing page: the program's next session, Foundations (for
// beginners), a couple of quick starts, the user's own saved workouts,
// and the splits. Each split opens its own page at /splits/[id].
// `locked` is a challenge account: the full programs come with the
// membership, so they sit folded away behind one row with a lock.
export default function SplitsList({
  upNext = null,
  locked = false,
  splits,
  strengthCheck = null,
  foundations = null,
  isBeginner = false,
  myWorkouts = [],
  hasChallengeHistory = false,
}) {
  const sections = groupBySection(splits).filter((s) => !isBeginner || s.section !== "coached");
  const others = sections.flatMap(({ items }) => items);
  const folded = isBeginner || locked;

  return (
    <div className="flex flex-col gap-8">
      {upNext ? <UpNext session={upNext} /> : null}

      {foundations ? <FoundationsCard split={foundations} isChallengeGraduate={hasChallengeHistory} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Quick start</h2>
        <div className="flex flex-col gap-2.5">
          <GuardedStartLink
            href="/log"
            className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <IconPlus className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-semibold text-fg">Log a workout</span>
              <span className="block truncate text-sm text-muted">Any lifts, no plan needed</span>
            </span>
            <IconChevron className="h-4 w-4 shrink-0 text-dim" />
          </GuardedStartLink>

          {strengthCheck && !locked ? (
            <TapLink
              href="/splits/strength-check"
              className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <IconGauge className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-semibold text-fg">Strength Check</span>
                <span className="block truncate text-sm text-muted">Test your main lifts every 4 to 6 weeks</span>
              </span>
              <IconChevron className="h-4 w-4 shrink-0 text-dim" />
            </TapLink>
          ) : null}
        </div>
      </section>

      <MyWorkoutsSection myWorkouts={myWorkouts} />

      {folded ? (
        <details className="group flex flex-col rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg/[0.07] text-muted">
              {locked ? <IconLock className="h-[18px] w-[18px]" /> : <IconGrid className="h-[18px] w-[18px]" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-base font-semibold text-fg">{locked ? "Programs" : "Other workouts"}</span>
              <span className="truncate text-sm text-muted">
                {locked ? "Open up after your 14 days" : "Every split, for later on"}
              </span>
            </span>
            <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
          </summary>
          {/* Plain rows inside the open card, not cards inside a card. */}
          <ul className="flex flex-col border-t border-border/70 px-2 py-1 [&>li+li]:border-t [&>li+li]:border-border/70">
            {others.map((split) => (
              <li key={split.id}>
                <SplitRow split={split} bare locked={locked} />
              </li>
            ))}
          </ul>
        </details>
      ) : (
        sections.map(({ section, items }) => (
          <section key={section} className="flex flex-col gap-3">
            <h2 className="px-1 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
              {SECTION_LABEL[section] ?? section}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {items.map((split) => (
                <li key={split.id}>
                  <SplitRow split={split} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

// A small count for the badge: "N days" -> N; "2-3x per week" -> "3x".
function splitCount(split) {
  const c = String(split.cadence || "");
  const days = c.match(/(\d+)\s*days?/i);
  if (days) return days[1];
  const perWeek = c.match(/(\d+)(?:\s*-\s*(\d+))?\s*x/i);
  if (perWeek) return `${perWeek[2] || perWeek[1]}x`;
  return String(split.days?.length || "");
}

// Each section has its own colour: splits are the app's orange,
// specialization programs are red (My workouts keeps its yellow stack).
const SECTION_TONE = {
  coached: "bg-coached/15 text-coached",
};

// The next planned session, one tap from the top of Train.
function UpNext({ session }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Up next</h2>
      <GuardedStartLink
        href={session.href}
        className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--panel-warm)] to-surface p-4 text-left transition-transform active:scale-[0.98]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <IconDumbbell className="h-[22px] w-[22px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] font-semibold tracking-[-0.01em] text-fg">{session.title}</span>
          <span className="block truncate text-sm text-muted">{session.detail}</span>
        </span>
        <span className="shrink-0 rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-black">Start</span>
      </GuardedStartLink>
    </section>
  );
}

function SplitRow({ split, bare = false, locked = false }) {
  return (
    <TapLink
      href={`/splits/${split.id}`}
      className={
        bare
          ? "flex w-full items-center gap-4 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
          : "flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
      }
    >
      <span
        className={`tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
          SECTION_TONE[split.section] ?? "bg-accent-soft text-accent"
        }`}
      >
        {splitCount(split)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold text-fg">{split.name}</span>
        <span className="block truncate text-xs text-dim">{split.cadence}</span>
      </span>
      {locked ? (
        <IconLock className="h-4 w-4 shrink-0 text-dim" aria-label="Members only" />
      ) : (
        <IconChevron className="h-4 w-4 shrink-0 text-dim" />
      )}
    </TapLink>
  );
}

function groupBySection(splits) {
  const order = ["primary", "coached"];
  const map = new Map();
  for (const s of splits) {
    if (!map.has(s.section)) map.set(s.section, []);
    map.get(s.section).push(s);
  }
  return [...map.keys()]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((section) => ({ section, items: map.get(section) }));
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
// Same mark as the Train tab.
function IconDumbbell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10" />
    </svg>
  );
}
function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}
function IconGauge(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 14a2 2 0 0 0 2-2c0-1.5-2-5-2-5s-2 3.5-2 5a2 2 0 0 0 2 2z" />
      <path d="M4.2 17a9 9 0 1 1 15.6 0" />
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
