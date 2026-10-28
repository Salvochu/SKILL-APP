"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startMesocycle, loadMesocycleOverview } from "@/app/(app)/dashboard/actions";
import { rirForWeek, isDeloadWeek } from "@/lib/mesocycle";
import ConfirmModal from "@/components/ConfirmModal";
import Sheet from "@/components/Sheet";
import ProgramLockModal from "@/components/challenge/ProgramLockModal";
import Explain from "@/components/Explain";

// Everything needed to start the guided program for one split, shown in a
// sheet: equipment, sessions per week (only for range-cadence splits), a
// look at how effort steps down across the weeks, then Start.
// `activeProgram` (if any) means another run is going, so starting is
// confirmed first.
export default function ProgramSetup({ template, activeProgram = null, advanced = true, onCancel }) {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(null);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [locked, setLocked] = useState(null);
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
    if (result?.locked) {
      setLocked(result.lockMode ?? "challenge");
      return;
    }
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  const weeks = template.weeks;
  const startingRir = overview?.startingRir ?? 3;
  const linear = overview?.linear ?? false;

  const chip = (on) =>
    `rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
      on ? "bg-fg text-bg" : "bg-fg/10 text-muted hover:text-fg"
    }`;

  return (
    <>
      <Sheet onClose={() => onCancel?.()} ariaLabel={`${weeks}-week guided program`}>
        {(close) => (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="flex items-center gap-1.5 font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                  {weeks}-week {linear ? "plan" : advanced ? "guided program" : "program"}
                  {!linear && advanced ? <Explain k="mesocycle" /> : null}
                </h3>
                <p className="flex items-center gap-1.5 text-[15px] leading-snug text-muted">
                  {linear
                    ? "The same sessions every week. Just turn up and beat your last numbers."
                    : advanced
                      ? "Effort builds week by week, then a deload."
                      : "Gets a bit harder each week, then an easy week."}
                  {!linear && advanced ? <Explain k="deload" /> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="loading-bar h-1 w-full rounded-full bg-fg/10" />
            ) : overview ? (
              <>
                {linear ? (
                  <ul className="overflow-hidden rounded-2xl bg-fg/[0.06] [&>*+*]:border-t [&>*+*]:border-fg/10">
                    {(overview.days ?? []).map((d, i) => (
                      <li key={i} className="flex flex-col px-4 py-3">
                        <span className="text-[16px] font-semibold text-fg">{d.name}</span>
                        {d.focus ? <span className="truncate text-[13px] text-muted">{d.focus}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  // How hard each week is, as a rising set of bars: effort
                  // climbs to the last hard week, then drops for the deload.
                  <div className="flex items-end gap-1.5">
                    {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
                      const deload = isDeloadWeek(w, weeks);
                      const hard = Math.max(1, weeks - 1);
                      const h = deload ? 28 : 36 + Math.round(((w - 1) / Math.max(1, hard - 1)) * 44);
                      return (
                        <div key={w} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-20 w-full items-end">
                            <div
                              className={`w-full rounded-lg ${deload ? "border-[1.5px] border-dashed border-fg/25" : "bg-accent"}`}
                              style={{ height: `${h}px`, opacity: deload ? 1 : 0.45 + (0.55 * w) / hard }}
                            />
                          </div>
                          <span className="flex flex-col items-center leading-tight">
                            <span className="text-[11px] font-medium text-dim">Wk {w}</span>
                            <span className={`text-[12px] font-semibold ${deload ? "text-muted" : "text-fg"}`}>
                              {advanced
                                ? deload
                                  ? "Deload"
                                  : `RIR ${rirForWeek(w, weeks, startingRir)}`
                                : deload
                                  ? "Easy"
                                  : "↑".repeat(Math.min(4, w))}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {overview.variants.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Equipment</span>
                    <div className="flex flex-wrap gap-2">
                      {overview.variants.map((v) => (
                        <button key={v} type="button" onClick={() => setVariant(v)} aria-pressed={v === variant} className={chip(v === variant)}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(overview.sessionOptions ?? []).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Sessions per week</span>
                    <div className="flex flex-wrap gap-2">
                      {overview.sessionOptions.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSessionsPerWeek(n)}
                          aria-pressed={n === sessionsPerWeek}
                          className={`min-w-12 tabular-nums ${chip(n === sessionsPerWeek)}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {error ? <p className="text-[14px] text-danger">{error}</p> : null}

                <button
                  type="button"
                  onClick={onStartClick}
                  disabled={starting}
                  className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60"
                >
                  {starting ? "Starting..." : "Start program"}
                </button>
              </>
            ) : (
              <p className="text-[15px] text-danger">{error}</p>
            )}
          </div>
        )}
      </Sheet>

      {locked ? <ProgramLockModal mode={locked} onClose={() => { setLocked(null); onCancel?.(); }} /> : null}

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
    </>
  );
}
