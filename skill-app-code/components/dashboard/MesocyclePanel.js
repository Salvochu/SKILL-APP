"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startMesocycle, finishMesocycle, abandonMesocycle } from "@/app/(app)/dashboard/actions";

export default function MesocyclePanel({ active, templates }) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(!active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onStart(templateId) {
    setBusy(true);
    setError(null);
    const result = await startMesocycle(templateId);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
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
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {active.nextDay ? (
          <Link
            href={`/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=Standard`}
            className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Start {active.nextDay.name}
          </Link>
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
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold text-fg">Pick the right program</h2>
          <p className="text-sm text-muted">
            Each one runs for its full length: effort builds week by week from RIR 3 down to 0, then
            a lighter deload week to recover before you start again.
          </p>
        </div>
        {active ? (
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="shrink-0 text-xs font-medium text-dim hover:text-fg"
          >
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {templates.length === 0 ? (
        <p className="text-sm text-muted">No programs are set up yet.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-field border border-border bg-bg/40 px-3 py-2.5">
              <span className="flex-1">
                <span className="block text-sm font-medium text-fg">{t.split?.name ?? t.name}</span>
                <span className="block text-xs text-dim">
                  {t.weeks} weeks . {t.split?.cadence}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onStart(t.id)}
                disabled={busy}
                className="shrink-0 rounded-field bg-accent px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
              >
                Start
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
