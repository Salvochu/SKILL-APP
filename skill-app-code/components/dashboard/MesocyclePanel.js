"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { abandonMesocycle } from "@/app/(app)/dashboard/actions";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgressBar from "@/components/ProgressBar";
import MesocycleComplete from "@/components/dashboard/MesocycleComplete";

export default function MesocyclePanel({ active, summary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onAbandon() {
    setBusy(true);
    setError(null);
    const result = await abandonMesocycle(active.id);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  // No program running: a slim prompt, nothing more. The full picker
  // lives on the Splits page.
  if (!active) {
    return (
      <TapLink
        href="/splits"
        className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconFlag className="h-[18px] w-[18px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-fg">Run a guided program</span>
          <span className="truncate text-xs text-dim">Turn a split into a week-by-week block</span>
        </span>
        <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
      </TapLink>
    );
  }

  if (active.isComplete) {
    return <MesocycleComplete active={active} summary={summary} />;
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
        Week {active.week} of {active.weeks}
        {active.isDeload ? " . Deload" : ""}
      </span>
      <h2 className="font-display text-lg font-semibold text-fg">{active.templateName}</h2>

      {active.guidance ? (
        <div className="rounded-field border border-accent/30 bg-accent-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {active.guidance.headline}
          </p>
          <p className="mt-1 text-sm text-fg">{active.guidance.detail}</p>
        </div>
      ) : null}

      {active.totalDays > 0 ? (
        <div className="flex flex-col gap-2 rounded-field border border-border bg-bg/40 p-3">
          <ProgressBar label="This week" value={Math.min(active.sessionsThisWeek, active.totalDays)} max={active.totalDays} />
          <ProgressBar
            label="Whole program"
            value={Math.min(active.sessionsLogged, active.weeks * active.totalDays)}
            max={active.weeks * active.totalDays}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {active.nextDay ? (
        <GuardedStartLink
          href={`/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`}
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start {active.nextDay.name}
        </GuardedStartLink>
      ) : (
        <p className="text-sm text-muted">This program&apos;s split has no days set up yet.</p>
      )}
      <div className="flex gap-2">
        <TapLink
          href="/splits"
          className="flex-1 rounded-field border border-accent/40 bg-accent-soft px-3 py-2 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
        >
          Switch program
        </TapLink>
        <button
          type="button"
          onClick={onAbandon}
          disabled={busy}
          className="flex-1 rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-black disabled:opacity-60"
        >
          Stop program
        </button>
      </div>
    </section>
  );
}

function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
