"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { abandonMesocycle } from "@/app/(app)/dashboard/actions";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import Explain from "@/components/Explain";
import MesocycleComplete from "@/components/dashboard/MesocycleComplete";
import { rirForWeek, isDeloadWeek } from "@/lib/mesocycle";
import { KEEP_TRAINING_URL } from "@/lib/links";

export default function MesocyclePanel({
  active,
  summary,
  isNew = false,
  isBeginner = false,
  challengeLapsed = false,
}) {
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
  const isChallenge = active.kind === "challenge";
  // Both run linear (no RIR ramp, no deload) and finish on session count.
  const linear = isFoundations || isChallenge;
  // The challenge shows its fork (keep training / work with Salvador)
  // once the 14 days are up or all the sessions are done. `challengeLapsed`
  // is the hard state a few days later: training is locked.
  const challengeOver =
    isChallenge &&
    (challengeLapsed ||
      active.isComplete ||
      (active.challengeDay ?? 0) >= (active.challengeDays ?? 14));

  // The days you can jump to from the menu, each distinct day once (a
  // twice-a-week split lists "Push" once, not twice).
  const pickableDays = [];
  const seenDays = new Set();
  for (const d of active.days ?? []) {
    if (seenDays.has(d.dayTemplateId)) continue;
    seenDays.add(d.dayTemplateId);
    pickableDays.push(d);
  }

  // Where the block stands, for the week rail. For a mesocycle that is
  // the calendar week; Foundations follows session count so a beginner
  // running behind still sees themselves on the right week.
  const railWeeks = active.weeks;
  const currentRailWeek = linear
    ? Math.min(railWeeks, Math.floor(active.sessionsLogged / 3) + 1)
    : active.week;
  const weekFill =
    active.sessionsPerWeek > 0
      ? Math.max(0, Math.min(1, active.sessionsThisWeek / active.sessionsPerWeek))
      : 0;

  // A finished mesocycle swaps to its end-of-block readout. Foundations
  // never hard-stops - it just adds a "ready to graduate" nudge to the
  // normal panel once the month is done (below).
  if (active.isComplete && !linear) {
    return <MesocycleComplete active={active} summary={summary} />;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-accent/30 bg-accent-soft p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent">
            {isChallenge ? (
              `Day ${Math.min(active.challengeDay ?? 1, active.challengeDays ?? 14)} of ${active.challengeDays ?? 14}`
            ) : isFoundations ? (
              `Session ${Math.min(active.sessionsLogged + 1, active.targetSessions)} of ${active.targetSessions}`
            ) : (
              <>
                Week {active.week} of {active.weeks}
                {active.isDeload ? (active.advanced ? " . Deload" : " . Easy week") : ""}
                {active.advanced ? <Explain k={active.isDeload ? "deload" : "mesocycle"} /> : null}
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
            <div className="absolute right-0 top-full z-10 mt-1 flex w-56 flex-col overflow-hidden rounded-card border border-border bg-surface py-1 shadow-lg">
              {pickableDays.length > 1 ? (
                <>
                  <span className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-dim">
                    Start a day
                  </span>
                  {pickableDays.map((d) => (
                    <GuardedStartLink
                      key={d.dayTemplateId}
                      href={`/log?meso=${active.id}&split=${active.splitId}&day=${d.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        {d.doneThisWeek ? (
                          <IconCheck className="h-3 w-3 shrink-0 text-good" />
                        ) : null}
                        <span className="truncate">{d.name}</span>
                      </span>
                      {d.isNext ? (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Next
                        </span>
                      ) : d.doneThisWeek ? (
                        <span className="shrink-0 text-[10px] font-medium text-dim">done</span>
                      ) : null}
                    </GuardedStartLink>
                  ))}
                  <div className="my-1 border-t border-border" />
                </>
              ) : null}
              <TapLink
                href="/splits"
                className="px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
              >
                Switch program
              </TapLink>
              <button
                type="button"
                onClick={onAbandon}
                disabled={busy}
                className="px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
              >
                Stop program
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {challengeOver ? (
        <div className="flex flex-col gap-3 rounded-field border border-accent/40 bg-surface p-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {challengeLapsed ? "Challenge ended" : "Your 14 days are up"}
            </p>
            <p className="text-sm text-fg">
              {challengeLapsed
                ? "Training is paused. Pick it back up and keep your streak, your level and your history."
                : `${active.sessionsLogged} session${active.sessionsLogged === 1 ? "" : "s"} logged. Keep the momentum, don't lose your streak and your level.`}
            </p>
          </div>
          <a
            href={KEEP_TRAINING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Keep training &mdash; &pound;14.99/mo
          </a>
          <TapLink
            href="/work-with-me"
            className="flex w-full items-center justify-center rounded-field border border-accent/40 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            Work with Salvador 1:1
          </TapLink>
        </div>
      ) : isFoundations && active.isComplete ? (
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

      {railWeeks > 1 ? (
        <div className="flex flex-col gap-3 rounded-field border border-border bg-surface p-3">
          <WeekRail
            weeks={railWeeks}
            currentWeek={currentRailWeek}
            weekFill={weekFill}
            startingRir={active.startingRir}
            showRir={active.advanced && !linear}
            hasDeload={!linear}
          />
          {active.sessionsPerWeek > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              {active.sessionsPerWeek <= 5 ? (
                <span className="flex gap-1">
                  {Array.from({ length: active.sessionsPerWeek }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i < active.sessionsThisWeek ? "bg-accent" : "bg-border-strong"
                      }`}
                    />
                  ))}
                </span>
              ) : null}
              <span className="text-muted">
                {Math.min(active.sessionsThisWeek, active.sessionsPerWeek)} of {active.sessionsPerWeek}{" "}
                sessions this week
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {challengeLapsed ? null : active.nextDay ? (
        <GuardedStartLink
          href={`/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`}
          className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start {active.nextDay.name}
        </GuardedStartLink>
      ) : (
        <p className="text-sm text-muted">This program&apos;s split has no days set up yet.</p>
      )}
    </section>
  );
}

// The block at a glance: one segment per week. Past weeks are full, the
// current week fills with this week's sessions, future weeks are empty.
// In the advanced app each segment is labelled with its RIR target and
// the last week is a dashed deload; the simple app just numbers them.
function WeekRail({ weeks, currentWeek, weekFill, startingRir, showRir, hasDeload }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
        const deload = hasDeload && isDeloadWeek(w, weeks);
        const isCurrent = w === currentWeek;
        const fillPct = w < currentWeek ? 100 : isCurrent ? Math.round(weekFill * 100) : 0;
        const label = !showRir
          ? deload
            ? "Easy"
            : `Wk ${w}`
          : deload
            ? "Deload"
            : `RIR ${rirForWeek(w, weeks, startingRir)}`;
        return (
          <div key={w} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`h-9 w-full overflow-hidden rounded-field border bg-bg ${
                deload ? "border-dashed border-accent/50" : "border-border-strong"
              } ${isCurrent ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""}`}
            >
              <div
                className="h-full rounded-field bg-accent transition-[width] duration-700"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span
              className={`text-[10px] font-medium ${isCurrent ? "text-accent" : "text-muted"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
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
