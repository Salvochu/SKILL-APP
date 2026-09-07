import LevelBadge from "@/components/dashboard/LevelBadge";

// The Journey level on its own: a distinct axis from the Strength Score
// (this one only ever goes up). Kept slim - the level, its tier, how far
// to the next one, and the lifetime totals that feed it.
export default function LevelCard({ journey, workouts, volumeLabel, timeLabel }) {
  if (!journey) return null;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Level</span>
          <span className="text-3xl font-bold text-fg">
            {journey.level}
            <span className="ml-1 text-base font-semibold text-dim">/ {journey.maxLevel}</span>
          </span>
        </div>
        <div className="mt-1">
          <LevelBadge journey={journey} compact />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="bar-fill h-full rounded-full"
            style={{ width: `${journey.pctToNextLevel}%`, backgroundColor: journey.tierColor }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-dim">
          <span className="tabular">{journey.xp.toLocaleString()} XP</span>
          <span>
            {journey.atMax
              ? "Max level"
              : `${journey.xpToNextLevel.toLocaleString()} XP to Level ${journey.level + 1}`}
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

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Stat label="Workouts" value={workouts} />
        <Stat label="Volume" value={volumeLabel} />
        <Stat label="Time" value={timeLabel} />
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</span>
      <span className="tabular truncate text-base font-bold text-fg">{value}</span>
    </div>
  );
}
