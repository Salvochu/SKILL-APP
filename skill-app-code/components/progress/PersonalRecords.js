import MusclePill from "@/components/MusclePill";
import { shortDate } from "@/components/progress/chartkit";

// Best-ever estimated 1RM per lift, most recent PR first.
export default function PersonalRecords({ records }) {
  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
      {records.map((r) => (
        <li key={r.name} className="flex items-center justify-between gap-3 bg-surface px-3 py-2.5">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-fg">{r.name}</span>
            <span className="flex items-center gap-2 text-xs text-dim">
              {r.muscle ? <MusclePill muscle={r.muscle} /> : null}
              <span className="tabular">
                {r.topWeight} kg x {r.topWeightReps}
                {r.best1rmDate ? ` . ${shortDate(r.best1rmDate)}` : ""}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="tabular block text-sm font-semibold text-fg">{r.best1rm} kg</span>
            <span className="block text-[10px] uppercase tracking-wider text-dim">est. 1RM</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
