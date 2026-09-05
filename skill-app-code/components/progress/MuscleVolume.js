import MusclePill from "@/components/MusclePill";

// Hard sets per muscle this week against a reference band. The point is
// the RP-style read: is each muscle getting enough stimulus, and how
// does it compare to last week.
export default function MuscleVolume({ data }) {
  const { muscles, target, trainedThisWeek } = data;
  const scaleMax = Math.max(target.high + 4, ...muscles.map((m) => m.thisWeek));

  return (
    <div className="flex flex-col gap-3">
      {!trainedThisWeek ? (
        <p className="text-sm text-muted">No sets logged yet this week.</p>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {muscles.map((m) => (
          <MuscleRow key={m.muscle} m={m} target={target} scaleMax={scaleMax} />
        ))}
      </ul>

      <p className="text-xs text-dim">
        The shaded band is {target.low} to {target.high} hard sets, a common weekly range for growth.
        Your own sweet spot may sit higher or lower.
      </p>
    </div>
  );
}

function MuscleRow({ m, target, scaleMax }) {
  const pct = (v) => Math.min(100, (v / scaleMax) * 100);
  const bandLeft = pct(target.low);
  const bandWidth = pct(target.high) - bandLeft;
  const delta = m.thisWeek - m.lastWeek;

  return (
    <li className="flex items-center gap-3">
      <span className="w-20 shrink-0">
        <MusclePill muscle={m.muscle} />
      </span>

      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <span
          className="absolute inset-y-0 bg-fg/10"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct(m.thisWeek)}%` }}
        />
      </div>

      <span className="flex w-12 shrink-0 items-baseline justify-end gap-1">
        <span className="tabular text-sm font-semibold text-fg">{m.thisWeek}</span>
        {delta !== 0 ? (
          <span className={`tabular text-[10px] ${delta > 0 ? "text-good" : "text-dim"}`}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        ) : null}
      </span>
    </li>
  );
}
