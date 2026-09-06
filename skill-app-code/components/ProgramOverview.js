"use client";

// The days list, equipment picker, sessions-per-week picker (only when
// the split's cadence is a range) and Start button for one mesocycle
// template's overview. Used by Splits' per-split "run as a program" card.
export default function ProgramOverview({
  overview,
  variant,
  onVariantChange,
  sessionsPerWeek,
  onSessionsChange,
  onStart,
  starting,
  error,
}) {
  const sessionOptions = overview.sessionOptions ?? [];

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

      {sessionOptions.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">
            Sessions per week
          </span>
          <div className="flex flex-wrap gap-2">
            {sessionOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onSessionsChange(n)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  n === sessionsPerWeek
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-fg"
                }`}
              >
                {n}
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
