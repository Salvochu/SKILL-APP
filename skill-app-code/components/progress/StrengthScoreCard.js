import { fromKg, unitLabel } from "@/lib/units";

// Beginner and Novice sit on the neutral surface; the top three tiers
// borrow the semantic colours (sky / good / accent) so a strong lift
// reads at a glance.
const TIER_STYLE = {
  Beginner: "bg-surface-2 text-dim",
  Novice: "bg-surface-2 text-muted",
  Intermediate: "bg-sky/15 text-sky",
  Advanced: "bg-good/15 text-good",
  Elite: "bg-accent-soft text-accent",
};

export default function StrengthScoreCard({ data, unit = "kg" }) {
  const U = unitLabel(unit);
  const conv = (kg) => Math.round(fromKg(kg, unit));

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Strength score</span>
          <span className="text-xs text-dim">
            {data.covered} of {data.total} lifts
          </span>
        </div>
        <span className="tabular text-3xl font-bold text-fg">
          {data.score > 0 ? conv(data.score) : "—"}
          {data.score > 0 ? <span className="ml-1 text-base font-semibold text-dim">{U}</span> : null}
        </span>
        <p className="text-xs text-dim">
          Best estimated 1RM across six key lifts, last {data.windowWeeks} weeks
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {data.patterns.map((p) => (
          <li key={p.key} className="flex items-center gap-3 bg-bg/40 px-3 py-2.5">
            <span className="w-[4.75rem] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {p.label}
            </span>
            {p.e1rm > 0 ? (
              <>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.lift}</span>
                <span className="tabular shrink-0 text-sm font-semibold text-fg">
                  {conv(p.e1rm)} {U}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    TIER_STYLE[p.tier] ?? "bg-surface-2 text-dim"
                  }`}
                >
                  {p.tier}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-dim">Not trained yet</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
