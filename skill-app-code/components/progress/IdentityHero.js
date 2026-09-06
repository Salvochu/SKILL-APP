import { fromKg, unitLabel } from "@/lib/units";

// The top of the Progress page: the one number that says how strong you
// are, the level it sits behind, and the three lifetime totals. Replaces
// the old stat grid plus the separate strength and journey cards.
export default function IdentityHero({ strength, journey, workouts, volumeLabel, timeLabel, unit = "kg" }) {
  const U = unitLabel(unit);
  const score = strength && strength.covered > 0 ? Math.round(fromKg(strength.score, unit)) : null;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Strength score</span>
          <span className="tabular text-4xl font-bold text-fg">
            {score != null ? score : "—"}
            {score != null ? <span className="ml-1.5 text-lg font-semibold text-dim">{U}</span> : null}
          </span>
        </div>
        {journey ? (
          <span
            className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{ color: journey.tierColor, borderColor: `${journey.tierColor}66` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: journey.tierColor }} />
            {journey.tier} · Level {journey.level}
          </span>
        ) : null}
      </div>

      {journey ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${journey.pctToNextLevel}%`, backgroundColor: journey.tierColor }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-dim">
            <span className="tabular">{journey.xp.toLocaleString()} XP</span>
            <span>
              {journey.atMax ? "Max level" : `${journey.xpToNextLevel.toLocaleString()} XP to Level ${journey.level + 1}`}
            </span>
          </div>
          {journey.nextTier ? (
            <p className="text-xs text-dim">
              Next rank{" "}
              <span className="font-semibold" style={{ color: journey.nextTier.color }}>
                {journey.nextTier.name}
              </span>{" "}
              at Level {journey.nextTier.min}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        <HeroStat label="Workouts" value={workouts} />
        <HeroStat label="Volume" value={volumeLabel} />
        <HeroStat label="Time" value={timeLabel} />
      </div>
    </section>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span className="tabular truncate text-base font-bold text-fg">{value}</span>
    </div>
  );
}
