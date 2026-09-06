"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compact } from "@/components/progress/chartkit";
import { finishMesocycle } from "@/app/(app)/dashboard/actions";

// The end-of-block moment: what got done, where strength moved, and the
// nudge to check in and start the next block.
export default function MesocycleComplete({ active, summary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const gains = summary?.gains ?? [];

  async function onFinish() {
    setBusy(true);
    setError(null);
    const result = await finishMesocycle(active.id);
    setBusy(false);
    if (result?.error) return setError(result.error);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-accent bg-accent-soft p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">Block complete</span>
        <h2 className="font-display text-lg font-semibold text-fg">
          {active.templateName}, all {active.weeks} weeks done
        </h2>
      </div>

      {summary && summary.sessionCount > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-field border border-accent/30 bg-surface p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-dim">Sessions</div>
            <div className="tabular text-xl font-bold text-fg">{summary.sessionCount}</div>
          </div>
          <div className="rounded-field border border-accent/30 bg-surface p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-dim">Volume</div>
            <div className="tabular text-xl font-bold text-fg">{compact(summary.totalVolume)} kg</div>
          </div>
        </div>
      ) : null}

      {gains.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-field border border-accent/30 bg-surface p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-dim">Strength change, start to finish</div>
          <ul className="flex flex-col gap-1">
            {gains.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-fg">{g.name}</span>
                <span className="tabular shrink-0 text-muted">
                  {g.from} <span className="text-dim">&rarr;</span> {g.to} kg{" "}
                  <span className={g.deltaPct > 0 ? "text-good" : g.deltaPct < 0 ? "text-dim" : "text-dim"}>
                    ({g.deltaPct > 0 ? "+" : ""}
                    {g.deltaPct}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Good time for a body check-in before the next block.{" "}
        <Link href="/body" className="font-medium text-accent hover:underline">
          Log one now
        </Link>
        .
      </p>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/splits"
          className="rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start the next block
        </Link>
        <button
          type="button"
          onClick={onFinish}
          disabled={busy}
          className="rounded-field border border-border bg-surface px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-60"
        >
          {busy ? "..." : "Not now"}
        </button>
      </div>
    </section>
  );
}
