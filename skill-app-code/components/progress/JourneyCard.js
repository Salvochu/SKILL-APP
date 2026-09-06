// Lifetime progression. The level and its tier are the headline; the XP
// breakdown sits in a disclosure so the card stays quiet.
export default function JourneyCard({ data }) {
  const { level, maxLevel, atMax, tier, tierColor, nextTier, xpIntoLevel, xpToNextLevel, pctToNextLevel } = data;
  const earned = data.breakdown.filter((b) => b.count > 0);

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Journey</span>
          <span className="text-2xl font-bold text-fg">
            Level {level}
            <span className="ml-1 text-sm font-semibold text-dim">/ {maxLevel}</span>
          </span>
        </div>
        <span
          className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
          style={{ color: tierColor, borderColor: `${tierColor}66` }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tierColor }} />
          {tier}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${pctToNextLevel}%`, backgroundColor: tierColor }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-dim">
          <span className="tabular">{data.xp.toLocaleString()} XP</span>
          <span>
            {atMax
              ? "Max level"
              : `${xpToNextLevel.toLocaleString()} XP to Level ${level + 1}`}
          </span>
        </div>
      </div>

      {earned.length > 0 ? (
        <details className="group text-sm">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-dim hover:text-fg [&::-webkit-details-marker]:hidden">
            Where your XP came from
            <IconChevron className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
            {earned.map((b) => (
              <li key={b.key} className="flex items-center justify-between gap-3 bg-bg/40 px-3 py-2 text-xs">
                <span className="text-muted">{b.label}</span>
                <span className="tabular shrink-0 text-dim">
                  <span className="text-fg">×{b.count}</span> · {b.xp.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {!atMax && nextTier ? (
        <p className="text-xs text-dim">
          Reach Level {nextTier.min} for{" "}
          <span className="font-semibold" style={{ color: nextTier.color }}>
            {nextTier.name}
          </span>
        </p>
      ) : null}
    </section>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
