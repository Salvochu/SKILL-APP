import TapLink from "@/components/TapLink";
import MusclePill from "@/components/MusclePill";
import { muscleKey } from "@/lib/exercises";

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Dashboard teaser: this week's hard sets per muscle group. Folded away
// by default so the dashboard stays calm; the full breakdown is on
// Progress.
export default function WeeklySetsMini({ data }) {
  const { groups, trainedThisWeek } = data;

  // Nothing logged this week yet: the card has nothing to say, so it
  // stays off the dashboard until there is a session to summarise.
  if (!trainedThisWeek) return null;

  const groupMax = Math.max(1, ...groups.map((g) => g.thisWeek));
  const total = groups.reduce((a, g) => a + g.thisWeek, 0);

  return (
    <details className="group flex flex-col rounded-card border border-border bg-surface [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Sets by muscle, this week</h2>
        <span className="flex items-center gap-2">
          <span className="tabular text-xs font-semibold text-fg">{fmt(total)} sets</span>
          <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim transition-transform group-open:rotate-90" />
        </span>
      </summary>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        <ul className="flex flex-col gap-1.5">
          {groups.map((g) => (
            <li key={g.parent} className="flex items-center gap-3">
              <span className="w-20 shrink-0">
                <MusclePill muscle={g.parent} />
              </span>
              <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-[width]"
                  style={{
                    width: `${Math.min(100, (g.thisWeek / groupMax) * 100)}%`,
                    backgroundColor: `var(--muscle-${muscleKey(g.parent)})`,
                  }}
                />
              </span>
              <span className="tabular w-8 shrink-0 text-right text-sm font-semibold text-fg">
                {fmt(g.thisWeek)}
              </span>
            </li>
          ))}
        </ul>
        <TapLink href="/progress" className="self-start text-xs font-medium text-accent hover:underline">
          See full breakdown
        </TapLink>
      </div>
    </details>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
