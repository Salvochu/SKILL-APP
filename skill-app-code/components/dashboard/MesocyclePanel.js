"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finishMesocycle, abandonMesocycle } from "@/app/(app)/dashboard/actions";
import ProgramPicker from "@/components/dashboard/ProgramPicker";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgressBar from "@/components/ProgressBar";

export default function MesocyclePanel({ active, templates }) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(!active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function onStarted() {
    setShowPicker(false);
    router.refresh();
  }

  async function onFinish() {
    setBusy(true);
    setError(null);
    const result = await finishMesocycle(active.id);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onAbandon() {
    setBusy(true);
    setError(null);
    const result = await abandonMesocycle(active.id);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setShowPicker(true);
    router.refresh();
  }

  if (active && !showPicker) {
    if (active.isComplete) {
      return (
        <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Program complete</span>
          <h2 className="font-display text-lg font-semibold text-fg">{active.templateName}</h2>
          <p className="text-sm text-muted">
            You finished all {active.weeks} weeks. Nice work. Start it again or pick something else below.
          </p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onFinish}
              disabled={busy}
              className="rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
            >
              Mark as done
            </button>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              disabled={busy}
              className="rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-60"
            >
              Choose a program
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Week {active.week} of {active.weeks}
          {active.isDeload ? " . Deload" : ""}
        </span>
        <h2 className="font-display text-lg font-semibold text-fg">{active.templateName}</h2>
        <p className="text-sm text-muted">
          {active.isDeload
            ? "Deload week: lighter sets, easy effort. Recover before the next block."
            : `Target effort this week: RIR ${active.rirTarget}.`}
        </p>

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
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex-1 rounded-field border border-accent/40 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
          >
            Switch program
          </button>
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

  return (
    <ProgramPicker
      templates={templates}
      canCancel={Boolean(active)}
      onCancel={() => setShowPicker(false)}
      onStarted={onStarted}
    />
  );
}
