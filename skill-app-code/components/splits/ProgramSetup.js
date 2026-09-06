"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startMesocycle, loadMesocycleOverview } from "@/app/(app)/dashboard/actions";
import { rirForWeek, isDeloadWeek } from "@/lib/mesocycle";
import ConfirmModal from "@/components/ConfirmModal";

// Everything needed to start the guided program for one split: equipment,
// sessions per week (only for range-cadence splits), a look at how effort
// steps down across the weeks, then Start. `activeProgram` (if any) means
// another run is going, so starting is confirmed first.
export default function ProgramSetup({ template, activeProgram = null, onCancel }) {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(null);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    loadMesocycleOverview(template.id)
      .then((detail) => {
        if (!alive) return;
        setLoading(false);
        if (!detail) {
          setError("Could not load that program.");
          return;
        }
        setOverview(detail);
        setVariant(detail.variants[0] ?? "Standard");
        const opts = detail.sessionOptions ?? [];
        setSessionsPerWeek(opts.length ? opts[opts.length - 1] : null);
      })
      .catch(() => alive && (setLoading(false), setError("Could not load that program.")));
    return () => {
      alive = false;
    };
  }, [template.id]);

  function onStartClick() {
    if (activeProgram) {
      setConfirming(true);
      return;
    }
    doStart();
  }

  async function doStart() {
    setConfirming(false);
    setStarting(true);
    setError(null);
    const result = await startMesocycle(template.id, variant, sessionsPerWeek);
    setStarting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  const weeks = template.weeks;
  const startingRir = overview?.startingRir ?? 3;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-accent/40 bg-accent-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-fg">{weeks}-week guided program</h3>
          <p className="text-xs text-muted">Effort builds week by week, then a deload.</p>
        </div>
        <button type="button" onClick={onCancel} className="shrink-0 text-xs font-medium text-dim hover:text-fg">
          Close
        </button>
      </div>

      {loading ? (
        <div className="loading-bar h-1 w-full rounded-full bg-surface-2" />
      ) : overview ? (
        <>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
              const deload = isDeloadWeek(w, weeks);
              return (
                <div
                  key={w}
                  className={`flex min-w-[3.25rem] flex-1 flex-col items-center rounded-field border px-1.5 py-1.5 text-center ${
                    deload ? "border-border bg-bg/40" : "border-accent/30 bg-surface"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase text-dim">Wk {w}</span>
                  <span className={`text-xs font-bold ${deload ? "text-dim" : "text-accent"}`}>
                    {deload ? "Deload" : `RIR ${rirForWeek(w, weeks, startingRir)}`}
                  </span>
                </div>
              );
            })}
          </div>

          {overview.variants.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">Equipment</span>
              <div className="flex flex-wrap gap-2">
                {overview.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      v === variant ? "border-accent bg-accent text-black" : "border-border text-muted hover:text-fg"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {(overview.sessionOptions ?? []).length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">Sessions per week</span>
              <div className="flex flex-wrap gap-2">
                {overview.sessionOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSessionsPerWeek(n)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      n === sessionsPerWeek ? "border-accent bg-accent text-black" : "border-border text-muted hover:text-fg"
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
            onClick={onStartClick}
            disabled={starting}
            className="rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
          >
            {starting ? "Starting..." : "Start program"}
          </button>
        </>
      ) : (
        <p className="text-sm text-danger">{error}</p>
      )}

      {confirming ? (
        <ConfirmModal
          title="A program is already running"
          message={`You are on ${activeProgram.splitName}, week ${activeProgram.week} of ${activeProgram.weeks}. Starting this one will end that program and its progress. Continue?`}
          confirmLabel="Start the new one"
          cancelLabel="Keep my program"
          danger
          onConfirm={doStart}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </section>
  );
}
