import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import FoundationsCard from "@/components/splits/FoundationsCard";

const SECTION_LABEL = { primary: "Choose your split", coached: "Coached programs" };

// The Train landing page: Foundations (for beginners), a couple of quick
// starts, and the splits. Each split opens its own page at /splits/[id].
export default function SplitsList({ splits, strengthCheck = null, foundations = null, isBeginner = false }) {
  const sections = groupBySection(splits).filter((s) => !isBeginner || s.section !== "coached");
  const others = sections.flatMap(({ items }) => items);

  return (
    <div className="flex flex-col gap-8">
      {foundations ? <FoundationsCard split={foundations} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Quick start</h2>
        <div className="flex flex-col gap-2.5">
          <GuardedStartLink
            href="/log"
            className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-accent-soft text-accent">
              <IconPlus className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-semibold text-fg">Log a workout</span>
              <span className="block text-sm text-muted">A free session, add any lifts you want</span>
            </span>
          </GuardedStartLink>

          {strengthCheck ? (
            <TapLink
              href="/splits/strength-check"
              className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-accent-soft text-accent">
                <IconGauge className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-base font-semibold text-fg">Strength Check</span>
                <span className="block text-sm text-muted">Benchmark your main lifts, every 4 to 6 weeks</span>
              </span>
              <IconChevron className="h-4 w-4 shrink-0 text-dim" />
            </TapLink>
          ) : null}
        </div>
      </section>

      {isBeginner ? (
        <details className="group flex flex-col rounded-card border border-border bg-surface [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <span className="flex flex-col">
              <span className="font-display text-base font-semibold text-fg">Other workouts</span>
              <span className="text-xs text-dim">Browse the full splits once you have the basics</span>
            </span>
            <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
          </summary>
          <ul className="flex flex-col gap-2.5 border-t border-border p-4">
            {others.map((split) => (
              <li key={split.id}>
                <SplitRow split={split} />
              </li>
            ))}
          </ul>
        </details>
      ) : (
        sections.map(({ section, items }) => (
          <section key={section} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
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

function SplitRow({ split }) {
  return (
    <TapLink
      href={`/splits/${split.id}`}
      className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-accent-soft text-base font-bold text-accent">
        {splitCount(split)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold text-fg">{split.name}</span>
        <span className="block truncate text-xs text-dim">{split.cadence}</span>
      </span>
      <IconChevron className="h-4 w-4 shrink-0 text-dim" />
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
