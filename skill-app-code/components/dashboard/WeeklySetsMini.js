import TapLink from "@/components/TapLink";
import MusclePill from "@/components/MusclePill";
import { muscleKey } from "@/lib/exercises";

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// Dashboard teaser: this week's hard sets per muscle group, linking to
// the full breakdown on Progress.
export default function WeeklySetsMini({ data }) {
  const { groups, trainedThisWeek } = data;
  const groupMax = Math.max(1, ...groups.map((g) => g.thisWeek));

  return (
    <TapLink
      href="/progress"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Sets by muscle, this week</h2>
        <IconChevron className="h-3.5 w-3.5 text-dim" />
      </div>

      {!trainedThisWeek ? (
        <p className="text-sm text-muted">No sets logged yet this week.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((g) => (
            <li key={g.parent} className="flex items-center gap-3">
              <span className="w-20 shrink-0">
                <MusclePill muscle={g.parent} />
              </span>
              <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
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
      )}
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
