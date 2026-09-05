"use client";

// The days list + equipment picker + Start button for one mesocycle
// template's overview. Shared by the dashboard's ProgramPicker (reached
// via a dropdown of every program) and Splits' per-split "run this as a
// program" entry (reached with the split already implied).
export default function ProgramOverview({ overview, variant, onVariantChange, onStart, starting, error }) {
  return (
    <div className="flex flex-col gap-3 rounded-field border border-border bg-bg/40 p-3">
      {overview.description ? <p className="text-sm text-muted">{overview.description}</p> : null}

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {overview.days.map((d) => (
          <li key={d.position} className="flex items-center justify-between gap-2 bg-surface px-3 py-2">
            <span className="text-sm font-medium text-fg">{d.name}</span>
            {d.focus ? <span className="truncate text-xs text-dim">{d.focus}</span> : null}
          </li>
        ))}
      </ul>

      {overview.variants.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Equipment</span>
          <div className="flex flex-wrap gap-2">
            {overview.variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onVariantChange(v)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  v === variant
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-fg"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={onStart}
        disabled={starting}
        className="rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {starting ? "Starting..." : "Start Program"}
      </button>
    </div>
  );
}
