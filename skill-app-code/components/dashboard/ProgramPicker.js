"use client";

import { useState } from "react";
import { startMesocycle, loadMesocycleOverview } from "@/app/(app)/dashboard/actions";
import ProgramOverview from "@/components/ProgramOverview";

// Choose a program from a dropdown, review its days and, if the split
// has real equipment variants, pick one, then start it. Splits with only
// "Standard" (the coached programs) skip the equipment step entirely.
export default function ProgramPicker({ templates, canCancel, onCancel, onStarted }) {
  const [selectedId, setSelectedId] = useState("");
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [variant, setVariant] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  async function onSelect(id) {
    setSelectedId(id);
    setOverview(null);
    setVariant("");
    setError(null);
    if (!id) return;
    setLoadingOverview(true);
    const detail = await loadMesocycleOverview(id);
    setLoadingOverview(false);
    if (!detail) {
      setError("Could not load that program.");
      return;
    }
    setOverview(detail);
    setVariant(detail.variants[0] ?? "Standard");
  }

  async function onStart() {
    setStarting(true);
    setError(null);
    const result = await startMesocycle(selectedId, variant);
    setStarting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onStarted();
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-accent/50 bg-accent-soft p-4 shadow-lg shadow-accent/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black">
            <IconFlag className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold text-fg">Pick the right program</h2>
            <p className="text-sm text-muted">
              Each one runs for its full length: effort builds week by week from RIR 3 down to 0,
              then a lighter deload week to recover before you start again.
            </p>
          </div>
        </div>
        {canCancel ? (
          <button type="button" onClick={onCancel} className="shrink-0 text-xs font-medium text-dim hover:text-fg">
            Cancel
          </button>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted">No programs are set up yet.</p>
      ) : (
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
        >
          <option value="">Choose a program</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.split?.name ?? t.name}, {t.weeks} weeks
            </option>
          ))}
        </select>
      )}

      {loadingOverview ? <p className="text-sm text-muted">Loading...</p> : null}

      {overview ? (
        <ProgramOverview
          overview={overview}
          variant={variant}
          onVariantChange={setVariant}
          onStart={onStart}
          starting={starting}
          error={error}
        />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}
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
