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
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />

      <div className="relative flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          <IconCheckCircle className="h-4 w-4" />
          Block complete
        </span>
        <h2 className="text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
          {active.templateName}, all {active.weeks} weeks done
        </h2>
      </div>

      {summary && summary.sessionCount > 0 ? (
        <div className="relative grid grid-cols-2 gap-4">
          <BigStat label="Sessions" value={summary.sessionCount} />
          <BigStat label="Volume" value={compact(summary.totalVolume)} unit="kg" />
        </div>
      ) : null}

      {gains.length > 0 ? (
        <div className="relative flex flex-col gap-2">
          <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
            Strength, start to finish
          </h3>
          <ul className="flex flex-col [&>*+*]:border-t [&>*+*]:border-border/70">
            {gains.map((g) => (
              <li key={g.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-[15px] text-fg">{g.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tabular text-[15px] text-muted">
                    {g.from} <span className="text-dim">&rarr;</span> <span className="text-fg">{g.to}</span> kg
                  </span>
                  <span
                    className={`tabular rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                      g.deltaPct > 0 ? "bg-good/15 text-good" : "bg-fg/10 text-muted"
                    }`}
                  >
                    {g.deltaPct > 0 ? "+" : ""}
                    {g.deltaPct}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="relative text-[15px] leading-relaxed text-muted">
        Good time for a body check-in before the next block.{" "}
        <Link href="/body" className="font-semibold text-accent hover:underline">
          Log one now
        </Link>
      </p>

      {error ? <p className="relative text-[14px] text-danger">{error}</p> : null}

      <div className="relative flex flex-col gap-2.5">
        <Link
          href="/splits"
          className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
        >
          Start the next block
        </Link>
        <button
          type="button"
          onClick={onFinish}
          disabled={busy}
          className="flex w-full items-center justify-center rounded-2xl bg-fg/10 px-4 py-4 text-[17px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Saving..." : "Not now"}
        </button>
      </div>
    </section>
  );
}

function BigStat({ label, value, unit = null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="tabular text-[28px] font-bold leading-none tracking-[-0.01em] text-fg">
        {value}
        {unit ? <span className="ml-1 text-[15px] font-semibold tracking-normal text-muted">{unit}</span> : null}
      </span>
    </div>
  );
}

function IconCheckCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16.2 9.5" />
    </svg>
  );
}
