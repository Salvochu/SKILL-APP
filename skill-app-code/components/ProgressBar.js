// Generic labelled progress bar. value/max in whatever unit the caller
// is counting (sessions, weeks, ...); this just renders the fraction.
// `tone` picks the fill colour: "accent" (default), "good" (green) or
// "danger" (red).
const TONES = { good: "bg-good", danger: "bg-danger", accent: "bg-accent" };

export default function ProgressBar({ label, value, max, tone = "accent" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill = TONES[tone] ?? TONES.accent;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-dim">{label}</span>
        <span className="tabular text-dim">
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full transition-[width] ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
