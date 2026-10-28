import LevelBadge from "@/components/dashboard/LevelBadge";

// The Journey level: a distinct axis from strength (this one only ever
// goes up). Body only - the page wraps it in a CollapsibleCard titled
// "Level". `footer` sits under it (the share button).
export default function LevelCard({ journey, footer = null }) {
  if (!journey) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <span className="tabular text-[44px] font-bold leading-[0.9] tracking-[-0.02em] text-fg">
          {journey.level}
          <span className="ml-1.5 text-[17px] font-semibold tracking-normal text-muted">/ {journey.maxLevel}</span>
        </span>
        <LevelBadge journey={journey} compact />
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
          <div
            className="bar-fill h-full rounded-full"
            style={{ width: `${journey.pctToNextLevel}%`, backgroundColor: journey.tierColor }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
          <span className="tabular font-semibold text-fg">{journey.xp.toLocaleString()} XP</span>
          <span>
            {journey.atMax
              ? "Max level"
              : `${journey.xpToNextLevel.toLocaleString()} XP to Level ${journey.level + 1}`}
          </span>
        </div>
        {journey.nextTier ? (
          <p className="text-[13px] text-muted">
            Next rank{" "}
            <span className="font-semibold" style={{ color: journey.nextTier.color }}>
              {journey.nextTier.name}
            </span>{" "}
            at Level {journey.nextTier.min}
          </p>
        ) : null}
      </div>

      {footer}
    </div>
  );
}
