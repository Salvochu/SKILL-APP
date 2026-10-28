"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { abandonMesocycle } from "@/app/(app)/dashboard/actions";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import Explain from "@/components/Explain";
import ConfirmModal from "@/components/ConfirmModal";
import MesocycleComplete from "@/components/dashboard/MesocycleComplete";
import { rirForWeek, isDeloadWeek } from "@/lib/mesocycle";
import { KEEP_TRAINING_URL } from "@/lib/links";

const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]";
const secondaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-fg/10 px-4 py-4 text-[17px] font-semibold text-fg transition-transform active:scale-[0.98]";
const menuRow =
  "flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-fg/5 active:bg-fg/10";

export default function MesocyclePanel({
  active,
  summary,
  isNew = false,
  isBeginner = false,
  challengeLapsed = false,
  hasChallengeHistory = false,
  unit = "kg",
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function onAbandon() {
    setConfirmStop(false);
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

  // No program running. Beginners get pointed straight at Foundations;
  // everyone else picks a program or just logs a session. (Once a
  // program IS running - even with no workouts logged yet - the active
  // panel below takes over.)
  if (!active) {
    // A challenge graduate: their run just got closed out on conversion
    // (see app/api/ghl/purchase/route.js), so they land here same as a
    // brand new beginner would - but "Start Foundations, your first
    // month" is the exact split they just spent up to 14 days on. Offer
    // an explicit choice instead of quietly re-suggesting it as if new.
    if (hasChallengeHistory && isBeginner) {
      return (
        <section className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">
              What&apos;s next?
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">
              You already know the 14-day split. Pick up where you left off, or try something new.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <TapLink href="/splits" className={`btn-shine ${primaryBtn}`}>
              Continue with your 14-day split
            </TapLink>
            <TapLink href="/splits" className={secondaryBtn}>
              Start a new program
            </TapLink>
          </div>
        </section>
      );
    }

    const programLabel = isBeginner ? "Start Foundations" : "Pick a training program";
    const programBlurb = isBeginner
      ? "Your first month: two full-body days, three times a week"
      : "Turn a split into a week-by-week block";
    if (isNew) {
      return (
        <div className="flex flex-col gap-3">
          <TapLink href="/splits" className={`btn-shine ${primaryBtn}`}>
            {programLabel}
            <IconArrow className="h-[18px] w-[18px]" />
          </TapLink>
          <GuardedStartLink
            href="/log"
            className="self-center rounded-lg px-2 py-1 text-[15px] font-medium text-muted transition-colors hover:text-fg"
          >
            or log a one-off workout
          </GuardedStartLink>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <GuardedStartLink href="/log" className={primaryBtn}>
          <IconPlay className="h-4 w-4" />
          Log a workout
        </GuardedStartLink>
        <TapLink
          href="/splits"
          className="flex items-center gap-3 rounded-2xl bg-surface p-4 transition-colors hover:bg-surface-2 active:bg-surface-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-black">
            <IconFlag className="h-[18px] w-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-semibold text-fg">{programLabel}</span>
            <span className="truncate text-[13px] text-muted">{programBlurb}</span>
          </span>
          <IconChevron className="h-4 w-4 shrink-0 text-dim" />
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
    return <MesocycleComplete active={active} summary={summary} unit={unit} />;
  }

  const dayHref = (dayTemplateId) =>
    `/log?meso=${active.id}&split=${active.splitId}&day=${dayTemplateId}&variant=${encodeURIComponent(active.variant)}`;

  return (
    <section className="relative flex flex-col gap-5 rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
      {/* The glow is clipped in its own layer, so the options menu can
          still hang below the card. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--panel-glow)" }}
        />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
            {isChallenge ? (
              `Day ${Math.min(active.challengeDay ?? 1, active.challengeDays ?? 14)} of ${active.challengeDays ?? 14}`
            ) : isFoundations ? (
              `Session ${Math.min(active.sessionsLogged + 1, active.targetSessions)} of ${active.targetSessions}`
            ) : (
              <>
                Week {active.week} of {active.weeks}
                {active.isDeload ? (active.advanced ? " · Deload" : " · Easy week") : ""}
                {active.advanced ? <Explain k={active.isDeload ? "deload" : "mesocycle"} /> : null}
              </>
            )}
          </span>
          <h2 className="text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
            {active.splitName}
          </h2>
        </div>

        <div ref={menuRef} className="relative -mr-1 shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Program options"
            aria-expanded={menuOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,color,transform] active:scale-90 ${
              menuOpen ? "bg-fg text-bg" : "bg-fg/10 text-fg"
            }`}
          >
            <IconDots className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="glass-strong pop-in absolute right-0 top-full z-30 mt-2 flex w-60 origin-top-right flex-col overflow-hidden rounded-2xl py-1.5">
              {pickableDays.length > 1 ? (
                <>
                  <span className="px-4 pb-1 pt-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-dim">
                    Start a day
                  </span>
                  {pickableDays.map((d) => (
                    <GuardedStartLink
                      key={d.dayTemplateId}
                      href={dayHref(d.dayTemplateId)}
                      className={`${menuRow} text-fg`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex w-4 shrink-0 justify-center">
                          {d.doneThisWeek ? <IconCheck className="h-3.5 w-3.5 text-good" /> : null}
                        </span>
                        <span className="truncate">{d.name}</span>
                      </span>
                      {d.isNext ? (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-semibold text-accent">
                          Next
                        </span>
                      ) : d.doneThisWeek ? (
                        <span className="shrink-0 text-[13px] text-dim">Done</span>
                      ) : null}
                    </GuardedStartLink>
                  ))}
                  <div className="mx-4 my-1 h-px bg-fg/10" />
                </>
              ) : null}
              <TapLink href="/splits" className={`${menuRow} text-fg`}>
                Switch program
              </TapLink>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmStop(true);
                }}
                disabled={busy}
                className={`${menuRow} text-danger disabled:opacity-60`}
              >
                Stop program
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {challengeOver ? (
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">
              {challengeLapsed ? "Challenge ended" : "Your 14 days are up"}
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              {challengeLapsed
                ? "Training is paused. Pick it back up and keep your streak, your level and your history."
                : `${active.sessionsLogged} session${active.sessionsLogged === 1 ? "" : "s"} logged. Keep the momentum, don't lose your streak and your level.`}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <a
              href={KEEP_TRAINING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-shine ${primaryBtn}`}
            >
              Keep training for &pound;7.99/mo
            </a>
            <TapLink
              href="/work-with-me"
              className="flex w-full items-center justify-center rounded-2xl bg-accent-soft px-4 py-4 text-[17px] font-semibold text-accent transition-transform active:scale-[0.98]"
            >
              Work with Salvador 1:1
            </TapLink>
          </div>
        </div>
      ) : isFoundations && active.isComplete ? (
        <div className="relative flex flex-col gap-1">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Month done</p>
          <p className="text-[15px] leading-relaxed text-muted">
            You have the lifts down. Ready for a structured program where effort builds week to week?
          </p>
          <TapLink
            href="/splits"
            className="mt-1 flex items-center gap-0.5 self-start rounded-lg py-1 text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
          >
            Pick your next program
            <IconChevron className="h-4 w-4" />
          </TapLink>
        </div>
      ) : active.guidance ? (
        <div className="relative flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconTarget className="h-[18px] w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <p className="text-[16px] font-semibold tracking-[-0.01em] text-fg">{active.guidance.headline}</p>
            <p className="text-[15px] leading-relaxed text-muted">{active.guidance.detail}</p>
          </div>
        </div>
      ) : null}

      {railWeeks > 1 && !isChallenge ? (
        <div className="relative flex flex-col gap-3">
          <WeekRail
            weeks={railWeeks}
            currentWeek={currentRailWeek}
            weekFill={weekFill}
            startingRir={active.startingRir}
            showRir={active.advanced && !linear}
            hasDeload={!linear}
          />
          {active.sessionsPerWeek > 0 ? (
            <div className="flex items-center gap-2 text-[13px]">
              {active.sessionsPerWeek <= 6 ? (
                <span className="flex gap-1">
                  {Array.from({ length: active.sessionsPerWeek }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i < active.sessionsThisWeek ? "bg-accent" : "bg-fg/15"}`}
                    />
                  ))}
                </span>
              ) : null}
              <span className="text-muted">
                <span className="font-semibold text-fg tabular-nums">
                  {Math.min(active.sessionsThisWeek, active.sessionsPerWeek)} of {active.sessionsPerWeek}
                </span>{" "}
                sessions this week
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {error || !challengeLapsed ? (
        <div className="relative flex flex-col gap-2">
          {error ? <p className="text-[14px] text-danger">{error}</p> : null}
          {challengeLapsed ? null : active.nextDay ? (
            // Once the challenge fork is showing, buying in is the main
            // action and training on is the quieter one.
            <GuardedStartLink
              href={dayHref(active.nextDay.dayTemplateId)}
              className={challengeOver ? secondaryBtn : primaryBtn}
            >
              <IconPlay className="h-4 w-4" />
              Start {active.nextDay.name}
            </GuardedStartLink>
          ) : (
            <p className="text-[15px] text-muted">This program&apos;s split has no days set up yet.</p>
          )}
        </div>
      ) : null}

      {confirmStop ? (
        <ConfirmModal
          title="Stop this program?"
          message="Your logged workouts stay in your history. You can start a new program any time."
          confirmLabel="Stop program"
          cancelLabel="Keep going"
          danger
          onConfirm={onAbandon}
          onCancel={() => setConfirmStop(false)}
        />
      ) : null}
    </section>
  );
}

// The block at a glance: one bar per week. Past weeks are full, the
// current week fills with this week's sessions, future weeks are empty.
// In the advanced app each bar is labelled with its RIR target and the
// last week is a dashed deload; the simple app just numbers them.
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
          <div key={w} className="flex min-w-0 flex-1 flex-col gap-2">
            <div
              className={`h-2 w-full overflow-hidden rounded-full ${deload ? "" : "bg-fg/10"}`}
              style={
                deload
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-fg) 16%, transparent) 0 5px, transparent 5px 9px)",
                    }
                  : undefined
              }
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span
              className={`truncate text-center text-[12px] tabular-nums ${
                isCurrent ? "font-semibold text-accent" : "font-medium text-dim"
              }`}
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
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 4.8v14.4a1 1 0 0 0 1.53.85l11.2-7.2a1 1 0 0 0 0-1.7L8.53 3.95A1 1 0 0 0 7 4.8Z" />
    </svg>
  );
}
function IconTarget(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
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
