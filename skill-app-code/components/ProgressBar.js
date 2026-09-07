// Generic labelled progress bar. value/max in whatever unit the caller
// is counting (sessions, weeks, ...); this just renders the fraction.
// `tone` picks the fill colour, which deepens from a pale tint toward a
// rich tone as the bar fills, so getting closer to the goal reads as
// more satisfying: "accent" (orange), "good" (green), "danger" (red) or
// "sky" (baby blue).
const TONES = {
  good: ["#a7d8ba", "#2e9e5b"],
  sky: ["#a9dcf0", "#2b9fd4"],
  danger: ["#f0b0b0", "#d83a3a"],
  accent: ["#f6c9a0", "#e8690a"],
};

export default function ProgressBar({ label, value, max, tone = "accent" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const [pale, rich] = TONES[tone] ?? TONES.accent;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-dim">{label}</span>
        <span className="tabular text-dim">
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="bar-fill h-full rounded-full transition-[width,background-color] duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: `color-mix(in oklab, ${rich} ${pct}%, ${pale})`,
          }}
        />
      </div>
    </div>
  );
}
