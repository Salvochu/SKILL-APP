"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { abandonMesocycle } from "@/app/(app)/dashboard/actions";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgressBar from "@/components/ProgressBar";
import Explain from "@/components/Explain";
import MesocycleComplete from "@/components/dashboard/MesocycleComplete";

export default function MesocyclePanel({ active, summary, isNew = false, isBeginner = false }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuOpen]);

  async function onAbandon() {
    setBusy(true);
    setError(null);
    setMenuOpen(false);
    const result = await abandonMesocycle(active.id);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  // No program running. Beginners get pointed straight at Foundations;
  // everyone else picks a program or just logs a session. (Once a
  // program IS running - even with no workouts logged yet - the active
  // panel below takes over.)
  if (!active) {
    const programLabel = isBeginner ? "Start Foundations" : "Pick a training program";
    const programBlurb = isBeginner
      ? "Your first month: two full-body days, three times a week"
      : "Turn a split into a week-by-week block";
    if (isNew) {
      return (
        <div className="flex flex-col gap-3">
          <TapLink
            href="/splits"
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-field bg-accent px-4 py-4 text-base font-semibold text-black transition-colors hover:bg-accent-2"
          >
            {programLabel}
            <IconArrow className="h-4 w-4" />
          </TapLink>
          <GuardedStartLink
            href="/log"
            className="self-center text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            or log a one-off workout
          </GuardedStartLink>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2.5">
        <GuardedStartLink
          href="/log"
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Log a workout
        </GuardedStartLink>
        <TapLink
          href="/splits"
          className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconFlag className="h-[18px] w-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-fg">{programLabel}</span>
            <span className="truncate text-xs text-dim">{programBlurb}</span>
          </span>
          <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
        </TapLink>
      </div>
    );
  }

  const isFoundations = active.kind === "foundations";

  // A finished mesocycle swaps to its end-of-block readout. Foundations
  // never hard-stops - it just adds a "ready to graduate" nudge to the
  // normal panel once the month is done (below).
  if (active.isComplete && !isFoundations) {
    return <MesocycleComplete active={active} summary={summary} />;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-accent/30 bg-accent-soft p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent">
            {isFoundations ? (
              `Session ${Math.min(active.sessionsLogged + 1, active.targetSessions)} of ${active.targetSessions}`
            ) : (
              <>
                Week {active.week} of {active.weeks}
                {active.isDeload ? " . Deload" : ""}
                <Explain k={active.isDeload ? "deload" : "mesocycle"} />
              </>
            )}
          </span>
          <h2 className="font-display text-xl font-semibold text-fg">{active.splitName}</h2>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Program options"
            aria-expanded={menuOpen}
            className="rounded-field p-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-fg"
          >
            <IconDots className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-10 mt-1 flex w-40 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-lg">
              <TapLink
                href="/splits"
                className="px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-surface-2"
              >
                Switch program
              </TapLink>
              <button
                type="button"
                onClick={onAbandon}
                disabled={busy}
                className="px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
              >
                Stop program
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isFoundations && active.isComplete ? (
        <div className="flex flex-col gap-2 rounded-field border border-accent/30 bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Month done</p>
          <p className="text-sm text-fg">
            You have the lifts down. Ready for a structured program where effort builds week to week?
          </p>
          <TapLink href="/splits" className="self-start text-sm font-semibold text-accent hover:underline">
            Pick your next program
          </TapLink>
        </div>
      ) : active.guidance ? (
        <div className="rounded-field border border-accent/30 bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {active.guidance.headline}
          </p>
          <p className="mt-1 text-sm text-fg">{active.guidance.detail}</p>
        </div>
      ) : null}

      {active.sessionsPerWeek > 0 ? (
        <div className="flex flex-col gap-2 rounded-field border border-border bg-surface p-3">
          <ProgressBar
            label="This week"
            value={Math.min(active.sessionsThisWeek, active.sessionsPerWeek)}
            max={active.sessionsPerWeek}
            tone="sky"
          />
          <ProgressBar
            label={isFoundations ? "Foundations" : "Whole program"}
            value={Math.min(
              active.sessionsLogged,
              isFoundations ? active.targetSessions : active.weeks * active.sessionsPerWeek,
            )}
            max={isFoundations ? active.targetSessions : active.weeks * active.sessionsPerWeek}
            tone="good"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {active.nextDay ? (
        <GuardedStartLink
          href={`/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`}
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start {active.nextDay.name}
        </GuardedStartLink>
      ) : (
        <p className="text-sm text-muted">This program&apos;s split has no days set up yet.</p>
      )}
    </section>
  );
}

function IconDots(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
function IconArrow(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
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
