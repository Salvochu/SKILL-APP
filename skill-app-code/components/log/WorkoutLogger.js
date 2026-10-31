"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkout, getPostSaveSummary, rateWorkout } from "@/app/(app)/log/actions";
import { saveNotificationPrefs } from "@/app/(app)/settings/actions";
import { createMyWorkout, updateMyWorkout } from "@/app/(app)/workouts/my-actions";
import RestTimer from "@/components/log/RestTimer";
import { useWakeLock } from "@/components/log/useWakeLock";
import ExercisePicker from "@/components/log/ExercisePicker";
import ReorderSheet from "@/components/log/ReorderSheet";
import LastNumbers from "@/components/log/LastNumbers";
import VideoModal from "@/components/log/VideoModal";
import SwipeRow from "@/components/log/SwipeRow";
import StatPill from "@/components/ui/StatPill";
import Switch from "@/components/ui/Switch";
import { Group, Row, rowInput } from "@/components/ui/Grouped";
import Explain from "@/components/Explain";
import ConfirmModal from "@/components/ConfirmModal";
import EdgeSwipeBack from "@/components/EdgeSwipeBack";
import FocusMode from "@/components/FocusMode";
import { FOCUS_LAYOUT } from "@/components/log/focusLayout";
import { formatSet, formatElapsed, EFFORT_LABELS, startingWeightHint } from "@/lib/training";
import { queueWorkout, isLikelyNetworkError } from "@/lib/offlineQueue";
import { saveDraft, getDraft, clearDraft } from "@/lib/activeWorkout";
import { buildShareImageBlob } from "@/lib/shareCard";
import { toKg, fromKg, formatWeight } from "@/lib/units";
import { tierColorFor } from "@/lib/strength";
import { loomEmbedUrl, isTimeBasedExercise, muscleKey } from "@/lib/exercises";

// Rest-timer start lengths offered in the logger's settings row. The
// full list also lives in the Settings screen.
const REST_LENGTHS = [30, 45, 60, 90, 120, 150, 180];

// Time-seeded so a resumed draft's saved keys (from a previous page
// load) can never collide with new ones generated after a reload.
let keySeq = 0;
const nextKey = () => `x${Date.now().toString(36)}${++keySeq}`;

// Tapping into a number field that is already pre-filled selects its
// contents, so the next keystroke overwrites instead of appending. The
// rAF is for iOS Safari, which ignores a select() called straight from
// the focus handler.
const selectOnFocus = (e) => {
  const el = e.currentTarget;
  requestAnimationFrame(() => {
    try {
      el.select();
    } catch {
      /* some input types do not support select() */
    }
  });
};

// The movement patterns the Strength Check tests (all six), so its finish
// recap does not pull in unrelated lift variants from the score window.
const BENCHMARK_PATTERNS = ["squat", "hinge", "hpush", "vpush", "hpull", "vpull"];

// Turns the exercises just logged into a reusable template: keep the
// order, count the working sets, and take the rep target that came up
// most often. Warm-ups do not count toward either.
function templateFromRows(rows) {
  return rows
    .map((r) => {
      const working = r.sets.filter((s) => !s.warmup);
      const repCounts = new Map();
      for (const s of working) {
        const v = String(s.reps ?? "").trim();
        if (v) repCounts.set(v, (repCounts.get(v) ?? 0) + 1);
      }
      const reps = [...repCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      return { exerciseId: r.exercise.id, sets: Math.max(1, working.length || 1), reps };
    })
    .filter((e) => e.exerciseId);
}

function epley1rm(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r || r > 15) return 0;
  return w * (1 + r / 30);
}

// Pre-fills each set's weight/reps/RIR from the same set number last
// time this exercise was logged (history[exercise.id]), so returning to
// an exercise is a tick-to-confirm instead of retyping everything. Still
// starts unticked either way; nothing counts until it is actually done.
function makeExercise(exercise, targetSets = 3, targetReps = "", last = null) {
  const lastSets = last?.sets ?? [];
  return {
    key: nextKey(),
    exercise,
    note: "",
    showNote: false,
    sets: Array.from({ length: Math.max(1, targetSets) }, (_, i) => {
      const prev = lastSets[i];
      return {
        weight: prev?.weight != null ? String(prev.weight) : "",
        reps: prev?.reps != null ? String(prev.reps) : "",
        rir: prev?.rir != null ? String(prev.rir) : "",
        completed: false,
        warmup: false,
      };
    }),
    targetReps,
    targetSets: Math.max(1, targetSets),
  };
}

export default function WorkoutLogger({ allExercises, history = {}, mesoContext = null, initial, unit = "kg", restTimer = true, defaultRest = 90, inlineVideos = false, advanced = true }) {
  const U = unit === "lb" ? "lb" : "kg";
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  // Real elapsed time, not a typed guess: starts the moment this screen
  // mounts (this is "starting the workout") and becomes the saved
  // duration. startedAt is captured once; `now` just ticks the display.
  // pausedAt is the timestamp of the current pause (null while running);
  // pausedTotalMs is the sum of every earlier pause, so time spent
  // paused is excluded from the saved duration.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [pausedAt, setPausedAt] = useState(null);
  const [pausedTotalMs, setPausedTotalMs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rows, setRows] = useState(() =>
    initial.exercises.map((e) => makeExercise(e.exercise, e.sets, e.reps, history[e.exercise.id])),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swapKey, setSwapKey] = useState(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [videoFor, setVideoFor] = useState(null);
  const [restKey, setRestKey] = useState(0);
  const [restSeconds, setRestSeconds] = useState(() => {
    const n = Math.round(Number(defaultRest));
    return Number.isFinite(n) && n >= 15 ? n : 90;
  });
  const [showRest, setShowRest] = useState(false);
  const [restTimerOn, setRestTimerOn] = useState(restTimer);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [finishConfirm, setFinishConfirm] = useState(null); // unticked set count
  const [completedSummary, setCompletedSummary] = useState(null);
  const [summaryExtras, setSummaryExtras] = useState(null);
  const [effort, setEffort] = useState(null);
  const [savingEffort, setSavingEffort] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  // The large title scrolling under the top bar swaps in the bar's small
  // title, the way an iOS navigation bar collapses.
  const [titleTucked, setTitleTucked] = useState(false);
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  // What this screen opened with, to tell "tapped in and straight back
  // out" (nothing to keep) from a workout that is actually under way.
  const openingRows = useRef(rows);
  const resumed = useRef(false);
  const shownBefore = useRef(false);

  // Keep the screen awake while a workout is being logged, so the phone
  // does not auto-lock between sets. Released once it is finished.
  useWakeLock(!completedSummary && !savedOffline);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setTitleTucked(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [completedSummary]);

  // On mount, resume a matching in-progress draft (same URL: same day,
  // same query), so navigating away and back via ActiveWorkoutBar
  // actually restores what was typed instead of a blank form. A draft
  // for a different URL is stale (GuardedStartLink already confirmed
  // discarding it before this page was reached) and is cleared.
  //
  // Next keeps a recently left screen alive but hidden, and shows that
  // same copy again on a return to the same URL; effects re-run when it
  // does. So a return with no draft to resume means that workout was
  // finished or discarded: start a fresh one rather than show it again.
  useEffect(() => {
    function startFresh() {
      const fresh = initial.exercises.map((e) => makeExercise(e.exercise, e.sets, e.reps, history[e.exercise.id]));
      openingRows.current = fresh;
      resumed.current = false;
      setRows(fresh);
      setTitle(initial.title);
      setDate(initial.date);
      setStartedAt(Date.now());
      setNow(Date.now());
      setPausedAt(null);
      setPausedTotalMs(0);
      setFinished(false);
      setSaving(false);
      setSavedOffline(false);
      setError(null);
      setShowRest(false);
      setSettingsOpen(false);
      setCompletedSummary(null);
      setSummaryExtras(null);
      setEffort(null);
    }
    function resumeIfMatching() {
      const href = window.location.pathname + window.location.search;
      const draft = getDraft();
      if (draft && draft.href === href) {
        setTitle(draft.title);
        setDate(draft.date);
        setRows(draft.rows);
        setStartedAt(draft.startedAt);
        setPausedAt(draft.pausedAt ?? null);
        setPausedTotalMs(draft.pausedTotalMs ?? 0);
        resumed.current = true;
      } else {
        if (draft) clearDraft();
        if (shownBefore.current) startFresh();
      }
      shownBefore.current = true;
      setDraftReady(true);
    }
    resumeIfMatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the draft in sync as the form changes, so ActiveWorkoutBar and
  // the resume-on-mount above always see the latest state. Waits for the
  // resume check above to finish first, so it cannot overwrite a draft
  // with this render's pre-resume values.
  useEffect(() => {
    if (!draftReady || finished) return;
    const href = window.location.pathname + window.location.search;
    saveDraft({ href, title, date, rows, startedAt, pausedAt, pausedTotalMs });
  }, [draftReady, title, date, rows, startedAt, pausedAt, pausedTotalMs, finished]);

  useEffect(() => {
    if (pausedAt || finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausedAt, finished]);

  useEffect(() => {
    if (!completedSummary) return;
    let cancelled = false;
    getPostSaveSummary(completedSummary.sessionId, initial.userMesocycleId).then((data) => {
      if (!cancelled) setSummaryExtras(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSummary]);

  // While paused (or finished), the "clock" is frozen at the moment the
  // pause started, so this stays constant instead of still ticking.
  const clockAt = pausedAt ?? now;
  const elapsedSeconds = Math.max(0, Math.round((clockAt - startedAt - pausedTotalMs) / 1000));

  function togglePause() {
    if (finished) return;
    if (pausedAt) {
      setPausedTotalMs((ms) => ms + (Date.now() - pausedAt));
      setPausedAt(null);
    } else {
      setPausedAt(Date.now());
    }
  }

  const totalVolume = useMemo(
    () =>
      rows.reduce(
        (sum, r) =>
          sum +
          r.sets.reduce(
            (s, set) =>
              s +
              (set.completed && !set.warmup
                ? (Number(set.weight) || 0) * (Number(set.reps) || 0)
                : 0),
            0,
          ),
        0,
      ),
    [rows],
  );

  const totalSets = useMemo(
    () =>
      rows.reduce(
        (n, r) => n + r.sets.filter((set) => set.completed && !set.warmup).length,
        0,
      ),
    [rows],
  );

  function patchRow(key, patch) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function patchSet(key, i, patch) {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? { ...r, sets: r.sets.map((s, si) => (si === i ? { ...s, ...patch } : s)) }
          : r,
      ),
    );
  }
  function toggleSet(key, i) {
    const row = rows.find((r) => r.key === key);
    const next = !row.sets[i].completed;
    patchSet(key, i, { completed: next });
    // Warm-ups do not kick off the rest timer.
    if (next && restTimerOn && !row.sets[i].warmup) {
      setRestKey((k) => k + 1);
      setShowRest(true);
    }
  }
  function addSet(key) {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? {
              ...r,
              sets: [
                ...r.sets,
                {
                  weight: r.sets.at(-1)?.weight ?? "",
                  reps: "",
                  rir: r.sets.at(-1)?.rir ?? "",
                  completed: false,
                  warmup: false,
                },
              ],
            }
          : r,
      ),
    );
  }
  function removeSet(key, i) {
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, sets: r.sets.filter((_, si) => si !== i) } : r)),
    );
  }
  function addExercise(exercise) {
    // The picker closes itself once, after every pick is added.
    setRows((rs) => [...rs, makeExercise(exercise, 3, "", history[exercise.id])]);
  }
  function removeExercise(key) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }
  // Swap the exercise on one card, keeping the sets already logged there.
  function swapExercise(exercise) {
    setRows((rs) => rs.map((r) => (r.key === swapKey ? { ...r, exercise } : r)));
    setSwapKey(null);
  }
  function reorderExercises(next) {
    setRows(next);
    setReorderOpen(false);
  }

  async function onSave() {
    setError(null);
    setSavedOffline(false);
    setSaving(true);
    // Freeze the clock the instant Save is tapped (unless it was already
    // paused), so the round trip to the server is not counted as part of
    // the workout.
    const wasAlreadyPaused = pausedAt != null;
    const freezeAt = pausedAt ?? Date.now();
    if (!wasAlreadyPaused) setPausedAt(freezeAt);
    setFinished(true);
    const durationMin = Math.max(0, Math.round((freezeAt - startedAt - pausedTotalMs) / 60000));
    // If the save does not go through, undo the freeze: fold the time
    // spent attempting to save into paused time and keep going, or leave
    // it paused if it already was before Save was tapped.
    function resumeAfterFailedSave() {
      setFinished(false);
      if (!wasAlreadyPaused) {
        setPausedTotalMs((ms) => ms + (Date.now() - freezeAt));
        setPausedAt(null);
      }
    }
    const payload = {
      title,
      date,
      durationMin,
      endedAtMs: freezeAt,
      splitId: initial.splitId,
      dayTemplateId: initial.dayTemplateId,
      variant: initial.variant,
      userMesocycleId: initial.userMesocycleId,
      exercises: rows.map((r) => ({
        exerciseId: r.exercise.id,
        note: r.note,
        sets: r.sets.map((s) => ({
          weight: s.weight === "" || s.weight == null ? s.weight : toKg(s.weight, U),
          reps: s.reps,
          rir: s.rir,
          completed: s.completed,
          warmup: s.warmup === true,
        })),
      })),
    };
    try {
      const result = await saveWorkout(payload);
      if (result?.error) {
        setError(result.error);
        setSaving(false);
        resumeAfterFailedSave();
        return;
      }
      clearDraft();
      setSaving(false);
      setCompletedSummary({ sessionId: result.sessionId, durationMin, totalVolume, totalSets });
    } catch (err) {
      if (isLikelyNetworkError(err)) {
        // No connection right now, most likely at the gym. Keep the
        // typed sets on this device instead of losing them; a background
        // sync (components/OfflineQueueSync.js) replays it once the
        // connection is back. The workout is considered done at this
        // point, so the clock stays stopped.
        queueWorkout(payload);
        clearDraft();
        setSaving(false);
        setSavedOffline(true);
        return;
      }
      setError("Something went wrong saving this workout. Try again.");
      setSaving(false);
      resumeAfterFailedSave();
    }
  }

  function onCancelWorkout() {
    // Mark finished first so the draft-sync effect cannot rewrite the
    // draft we are about to clear while the route transition settles.
    setFinished(true);
    clearDraft();
    router.push("/dashboard");
  }

  // Finish straight away when every planned set is ticked; otherwise
  // say how many are not, since a stray tap on Finish mid-workout would
  // otherwise end it early.
  function onFinish() {
    const unticked = rows.reduce(
      (n, r) => n + r.sets.filter((set) => !set.completed && !set.warmup).length,
      0,
    );
    if (unticked > 0 && totalSets > 0) setFinishConfirm(unticked);
    else onSave();
  }

  // Back leaves the workout running: the clock keeps going and the
  // floating pill on every other screen brings you straight back. The
  // exception is tapping in and right back out, untouched, which just
  // never started it.
  function leave() {
    const untouched =
      !resumed.current &&
      rows === openingRows.current &&
      title === initial.title &&
      Date.now() - startedAt < 5 * 60 * 1000;
    if (untouched) {
      setFinished(true);
      clearDraft();
    }
    if (window.history.length > 1) router.back();
    else router.push("/dashboard");
  }

  async function onSelectEffort(n) {
    setEffort(n);
    if (!completedSummary?.sessionId) return;
    setSavingEffort(true);
    await rateWorkout(completedSummary.sessionId, n);
    setSavingEffort(false);
  }

  if (completedSummary) {
    return (
      <WorkoutSummary
        summary={completedSummary}
        extras={summaryExtras}
        isBenchmark={initial.splitId === "strength-check"}
        effort={effort}
        unit={U}
        savingEffort={savingEffort}
        onSelectEffort={onSelectEffort}
        onDone={() => router.push("/dashboard")}
        saveAsWorkout={(() => {
          const cleanName = title.replace(/\s*\.\s*Week \d+ of \d+.*$/, "").trim() || "My workout";
          const startedFromId = initial.myWorkoutId ?? null;
          const fromTemplate = Boolean(startedFromId || initial.dayTemplateId);
          const initialIds = initial.exercises.map((e) => e.exercise?.id).filter(Boolean);
          const currentIds = rows.map((r) => r.exercise.id);
          const modified =
            fromTemplate &&
            (initialIds.length !== currentIds.length ||
              currentIds.some((id, i) => id !== initialIds[i]));
          return {
            defaultName: cleanName,
            exercises: templateFromRows(rows),
            sourceMyWorkoutId: startedFromId,
            sourceName: fromTemplate ? cleanName : null,
            modified,
          };
        })()}
      />
    );
  }

  const shownTitle = title.replace(/\s*\.\s*Week \d+ of \d+.*$/, "") || "Workout";

  return (
    <>
    {/* Focus mode slides the app's own bars away while a workout is on
        screen: this screen is the whole phone. */}
    <FocusMode />
    <div ref={rootRef} className={`flex flex-col gap-6 pb-2 ${FOCUS_LAYOUT}`}>
      {/* iOS navigation bar: back and settings stay in reach however far
          down the workout you are. The large title below scrolls under
          it, and the bar turns to glass and takes a small copy of the
          title as it does. A direct child of the screen, so it stays
          pinned for the whole page rather than just its own section. */}
      <div
        className={`sticky top-0 z-30 -mx-4 -mb-5 px-4 pb-2 pt-[max(0.625rem,env(safe-area-inset-top))] transition-[background-color,box-shadow,backdrop-filter] duration-200 md:-mx-6 md:px-6 ${
          titleTucked ? "glass-bar" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={leave}
            aria-label="Back. Your workout keeps running."
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform duration-150 active:scale-90"
          >
            <IconChevron className="h-[18px] w-[18px] rotate-180" />
          </button>
          <span
            aria-hidden={!titleTucked}
            className={`min-w-0 flex-1 truncate text-center text-[16px] font-semibold tracking-[-0.01em] text-fg transition-[opacity,transform] duration-200 ${
              titleTucked ? "opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {shownTitle}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
            aria-label="Workout settings"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 ${
              settingsOpen ? "bg-accent text-black" : "bg-fg/10 text-fg"
            }`}
          >
            <IconGear className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      <h1
        ref={titleRef}
        className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg"
      >
        {shownTitle}
      </h1>

      {cancelConfirm ? (
        <ConfirmModal
          title="Discard this workout?"
          message="Nothing from this session will be saved."
          confirmLabel="Discard"
          cancelLabel="Keep logging"
          danger
          onConfirm={onCancelWorkout}
          onCancel={() => setCancelConfirm(false)}
        />
      ) : null}

      {settingsOpen ? (
        <div className="pop-in flex flex-col gap-2">
          <Group>
            <Row label="Name" htmlFor="wl-name">
              <input id="wl-name" value={title} onChange={(e) => setTitle(e.target.value)} className={rowInput} />
            </Row>
            <Row label="Date" htmlFor="wl-date">
              {/* iOS Safari's native date control can paint wider than the
                 width it is given; overflow-hidden clips it to the row. */}
              <div className="flex w-full min-w-0 justify-end overflow-hidden">
                <input
                  id="wl-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-w-0 appearance-none bg-transparent py-3 text-right text-[16px] text-muted outline-none focus:text-fg [&::-webkit-date-and-time-value]:text-right"
                />
              </div>
            </Row>
            <Row label="Rest timer">
              <Switch
                checked={restTimerOn}
                label="Rest timer after each set"
                onChange={(next) => {
                  setRestTimerOn(next);
                  if (!next) setShowRest(false);
                }}
              />
            </Row>
            {restTimerOn ? (
              <div className="flex flex-col gap-2 px-4 py-3">
                <span className="text-[13px] text-muted">Rest length</span>
                <div role="radiogroup" aria-label="Rest length" className="flex rounded-[10px] bg-surface-2 p-0.5">
                  {REST_LENGTHS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      role="radio"
                      aria-checked={restSeconds === sec}
                      onClick={() => {
                        setRestSeconds(sec);
                        try {
                          localStorage.setItem("pref:restSeconds", String(sec));
                        } catch {
                          /* ignore */
                        }
                        saveNotificationPrefs({ defaultRestSeconds: sec }).catch(() => {});
                      }}
                      className={`flex-1 rounded-[8px] py-1.5 text-[12px] font-semibold tabular-nums transition-colors ${
                        restSeconds === sec ? "bg-fg text-bg shadow-sm" : "text-muted"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </Group>
        </div>
      ) : null}

      {mesoContext ? (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-accent-soft px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {mesoContext.kind === "foundations" ? (
              <span className="text-sm font-semibold text-accent">
                {mesoContext.guidance?.headline ?? "Foundations"}
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1 text-sm font-semibold text-accent">
                  Week {mesoContext.week} of {mesoContext.weeks}
                  {advanced ? <Explain k={mesoContext.isDeload ? "deload" : "mesocycle"} /> : null}
                </span>
                <span className="text-sm text-accent">
                  {mesoContext.guidance?.headline ??
                    (mesoContext.isDeload
                      ? "Deload week"
                      : advanced
                        ? `Target effort: RIR ${mesoContext.rirTarget}`
                        : "Push a little harder than last week")}
                </span>
              </>
            )}
          </div>
          {mesoContext.guidance?.detail ? (
            <p className="text-sm text-fg">{mesoContext.guidance.detail}</p>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconPlus />
          </span>
          <p className="text-[15px] text-muted">No exercises added yet.</p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-full bg-accent px-5 py-2.5 text-[15px] font-semibold text-black transition-transform active:scale-[0.97]"
          >
            Add exercise
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row, index) => {
            // A first-time tip like "start with the empty bar" is said
            // once, on the first lift it applies to, not on every one.
            const hint =
              mesoContext?.kind === "foundations" && !history[row.exercise.id]
                ? startingWeightHint(row.exercise.equipment)
                : null;
            const firstWithHint =
              hint &&
              rows.findIndex(
                (r) => !history[r.exercise.id] && startingWeightHint(r.exercise.equipment) === hint,
              ) === index;
            return (
            <ExerciseCard
              key={row.key}
              row={row}
              showTips={index === 0}
              unit={U}
              last={history[row.exercise.id] ?? null}
              onPatch={(p) => patchRow(row.key, p)}
              onPatchSet={(i, p) => patchSet(row.key, i, p)}
              onToggleSet={(i) => toggleSet(row.key, i)}
              onAddSet={() => addSet(row.key)}
              onRemoveSet={(i) => removeSet(row.key, i)}
              onRemove={() => removeExercise(row.key)}
              onSwap={() => setSwapKey(row.key)}
              onReorder={rows.length > 1 ? () => setReorderOpen(true) : null}
              onVideo={() => setVideoFor(row.exercise)}
              inlineVideo={inlineVideos}
              startHint={firstWithHint ? hint : null}
              rirTarget={advanced ? mesoContext?.rirTarget ?? null : null}
              showRir={advanced && mesoContext?.kind !== "foundations"}
              showFailure={!advanced && mesoContext?.kind !== "foundations"}
              beatLabel={
                mesoContext?.kind === "foundations"
                  ? "Beat last time"
                  : mesoContext && mesoContext.week > 1 && !mesoContext.isDeload
                    ? "Beat last week"
                    : null
              }
            />
            );
          })}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface py-4 text-[15px] font-semibold text-accent transition-[transform,background-color] active:scale-[0.98] active:bg-surface-2"
          >
            <IconPlus /> Add another exercise
          </button>
        </div>
      )}

      {/* Where Strong and Hevy keep it: out of the way at the end, so it
          is never hit by accident mid-set. */}
      <button
        type="button"
        onClick={() => setCancelConfirm(true)}
        className="self-center rounded-lg px-3 py-1.5 text-[15px] font-medium text-danger transition-opacity active:opacity-50"
      >
        Discard workout
      </button>

      {error ? (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[14px] text-danger">{error}</p>
      ) : null}
      {savedOffline ? (
        <p className="rounded-2xl bg-accent-soft px-4 py-3 text-[14px] text-accent">
          No connection right now. This workout is saved on this device and will sync automatically once
          you are back online.
        </p>
      ) : null}

      {/* The rest timer takes over the header bar while it runs (fixed),
          so it never stacks on the workout pill down here. */}
      {showRest ? (
        <RestTimer key={restKey} startSeconds={restSeconds} onDismiss={() => setShowRest(false)} />
      ) : null}

      {/* The workout bar sits exactly where the tab bar was (same
          capsule, same height off the bottom), so it reads as the tab bar
          turning into the workout's controls. */}
      <div className="sticky bottom-[max(2.75rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-40 md:bottom-6">
        <div className="glass mx-auto flex max-w-md items-center gap-2.5 rounded-full p-1.5">
          <button
            type="button"
            onClick={togglePause}
            disabled={finished}
            aria-label={pausedAt ? "Resume timer" : "Pause timer"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90 disabled:opacity-50"
          >
            {pausedAt ? <IconPlay className="ml-0.5 h-4 w-4" /> : <IconPause className="h-4 w-4" />}
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold leading-tight tabular-nums tracking-[-0.01em] text-fg">
                {formatElapsed(elapsedSeconds)}
              </span>
              {pausedAt && !finished ? (
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-dim">Paused</span>
              ) : null}
            </span>
            <span className="truncate text-[13px] leading-tight tabular-nums text-muted">
              {Math.round(totalVolume).toLocaleString("en-GB")} {U} · {totalSets} {totalSets === 1 ? "set" : "sets"}
            </span>
          </div>
          <button
            type="button"
            onClick={onFinish}
            disabled={saving || savedOffline}
            className="h-11 shrink-0 rounded-full bg-accent px-5 text-[15px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.96] disabled:opacity-60"
          >
            {savedOffline ? "Saved" : saving ? "Saving..." : "Finish"}
          </button>
        </div>
      </div>

      {finishConfirm ? (
        <ConfirmModal
          title="Finish this workout?"
          message={`${finishConfirm} planned ${finishConfirm === 1 ? "set isn't" : "sets aren't"} ticked off yet. Only what you've logged gets saved.`}
          confirmLabel="Finish"
          cancelLabel="Keep going"
          onConfirm={() => {
            setFinishConfirm(null);
            onSave();
          }}
          onCancel={() => setFinishConfirm(null)}
        />
      ) : null}

      {pickerOpen ? (
        <ExercisePicker
          exercises={allExercises}
          multiple
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
      {swapKey ? (
        <ExercisePicker
          exercises={allExercises}
          title="Swap exercise"
          onPick={swapExercise}
          onClose={() => setSwapKey(null)}
        />
      ) : null}
      {reorderOpen ? (
        <ReorderSheet rows={rows} onSave={reorderExercises} onClose={() => setReorderOpen(false)} />
      ) : null}
      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
    </div>
    <EdgeSwipeBack targetRef={rootRef} onBack={leave} enabled={!saving && !savedOffline} />
    </>
  );
}

function ShareCard({ summary, timeLabel, effortLabel, unit = "kg", muscles = null }) {
  const [status, setStatus] = useState("idle"); // idle | preparing | shared | downloaded | copied

  const caption = `Just logged ${Math.round(summary.totalVolume)} ${unit} in ${timeLabel} with SKILL. @salvador_skfitness`;

  async function onShare() {
    setStatus("preparing");
    let blob = null;
    try {
      blob = await buildShareImageBlob({
        volumeLabel: `${Math.round(summary.totalVolume)} ${unit}`,
        timeLabel,
        effortLabel,
        topMuscles: muscles?.top ?? [],
        totalSets: muscles?.totalSets ?? 0,
      });
    } catch {
      // Image generation failed (e.g. the logo did not load); fall back
      // to a text-only share below rather than getting stuck.
    }

    const file = blob ? new File([blob], "skill-workout.png", { type: "image/png" }) : null;

    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        setStatus("shared");
        return;
      } catch {
        // Cancelled from the share sheet: leave it at that, do not also
        // fall through to a download the user did not ask for.
        setStatus("idle");
        return;
      }
    }

    // No file-sharing support (most desktop browsers): offer the image
    // as a download and the caption on the clipboard, so both pieces are
    // still one tap away from being posted manually.
    if (blob) downloadBlob(blob, "skill-workout.png");
    try {
      await navigator.clipboard.writeText(caption);
      setStatus(blob ? "downloaded" : "copied");
    } catch {
      setStatus(blob ? "downloaded" : "idle");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-accent-soft p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black">
          <IconShare className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-fg">Show it off</h2>
          <p className="text-sm text-muted">
            Post it to your Instagram story and tag{" "}
            <span className="text-fg">@salvador_skfitness</span> so he can hold you accountable.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onShare}
        disabled={status === "preparing"}
        className="rounded-full bg-surface px-4 py-3 text-[15px] font-semibold text-accent transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {status === "preparing"
          ? "Preparing..."
          : status === "shared"
            ? "Shared"
            : status === "downloaded"
              ? "Image saved, caption copied"
              : status === "copied"
                ? "Caption copied"
                : "Share"}
      </button>
    </section>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function IconShare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
    </svg>
  );
}

// Finish-screen dialog: keep the session that was just logged as a
// reusable "my workout". Opened from the bookmark icon in the summary
// header (and from the "you changed this" nudge). When the session began
// from an existing my workout that has since been edited, it also offers
// to update that one in place.
function SaveWorkoutModal({ defaultName, exercises, sourceMyWorkoutId, sourceName, modified, onClose }) {
  const [name, setName] = useState(defaultName);
  const [state, setState] = useState("form"); // form | saving | saved
  const [error, setError] = useState(null);
  const canUpdate = Boolean(sourceMyWorkoutId && modified);

  async function run(kind) {
    setError(null);
    if (kind === "new" && !name.trim()) {
      setError("Give it a name.");
      return;
    }
    setState("saving");
    const result =
      kind === "update"
        ? await updateMyWorkout(sourceMyWorkoutId, { name: sourceName, exercises })
        : await createMyWorkout({ name, exercises });
    if (result?.error) {
      setError(result.error);
      setState("form");
      return;
    }
    setState("saved");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Save to My workouts"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5">
        {state === "saved" ? (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good/20 text-good">
                <IconCheck className="h-5 w-5" />
              </span>
              <p className="text-sm text-fg">
                Saved to <span className="font-semibold">My workouts</span> on the Train tab.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-accent py-3 text-[15px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98]"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-lg font-semibold text-fg">Save to My workouts</h3>
              <p className="text-sm text-muted">
                {exercises.length} exercise{exercises.length === 1 ? "" : "s"}, ready to start again any day from
                the Train tab.
              </p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={selectOnFocus}
                autoFocus
                placeholder="Workout name"
                className="w-full rounded-xl bg-fg/10 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
              />
            </label>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <div className="flex flex-col gap-2">
              {canUpdate ? (
                <button
                  type="button"
                  onClick={() => run("update")}
                  disabled={state === "saving"}
                  className="rounded-2xl bg-fg/10 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  Update &ldquo;{sourceName}&rdquo;
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => run("new")}
                disabled={state === "saving"}
                className="rounded-2xl bg-accent py-3 text-[15px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60"
              >
                {state === "saving" ? "Saving..." : canUpdate ? "Save as a new workout" : "Save workout"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl py-2.5 text-[15px] font-medium text-muted transition-colors hover:text-fg"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WorkoutSummary({ summary, extras, isBenchmark = false, effort, unit = "kg", savingEffort, onSelectEffort, onDone, saveAsWorkout = null }) {
  const mins = summary.durationMin;
  const timeLabel = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  const prs = extras?.newPRs ?? [];
  const j = extras?.journey ?? null;
  const s = extras?.strength ?? null;
  const scoreU = (kg) => Math.round(fromKg(kg, unit));
  // Level progress and the strength score only appear once there is a
  // track record; a first workout's finish screen stays minimal.
  const established = (extras?.workoutCount ?? 1) >= 2;
  const benchmarkRecap = isBenchmark && s && s.covered > 0;
  const showLevel = established && j;

  const [saveOpen, setSaveOpen] = useState(false);
  const canSave =
    saveAsWorkout &&
    saveAsWorkout.exercises.length > 0 &&
    !(saveAsWorkout.sourceMyWorkoutId && !saveAsWorkout.modified);

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="relative flex flex-col items-center gap-1 pt-2 text-center">
        <span className="check-pop flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black shadow-[0_10px_30px_-8px_rgba(252,118,5,0.6)]">
          <IconCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-3 text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Workout completed!</h1>
        <p className="text-[15px] text-muted">Nice work. Here is how it went.</p>
        {canSave ? (
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            aria-label="Save this workout to My workouts"
            className="absolute right-0 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted transition-[color,transform] hover:text-fg active:scale-90"
          >
            <IconBookmark className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      {canSave && saveAsWorkout.modified ? (
        <button
          type="button"
          onClick={() => setSaveOpen(true)}
          className="flex items-center justify-between gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 text-left transition-transform active:scale-[0.98]"
        >
          <span className="text-sm text-fg">
            {saveAsWorkout.sourceMyWorkoutId
              ? `You changed ${saveAsWorkout.sourceName}. Save this version?`
              : "You changed this session. Save it to My workouts?"}
          </span>
          <IconBookmark className="h-4 w-4 shrink-0 text-accent" />
        </button>
      ) : null}

      {prs.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-2xl bg-accent-soft p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-accent">
            <IconTrophy className="h-4 w-4" />
            {prs.length === 1 ? "New personal record" : `${prs.length} new personal records`}
          </h2>
          <ul className="flex flex-col gap-1">
            {prs.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-fg">{p.name}</span>
                <span className="tabular shrink-0 text-muted">
                  {formatWeight(p.weight, unit, { decimals: 0 })} x {p.reps}{" "}
                  <span className="text-dim">~{formatWeight(p.e1rm, unit, { decimals: 0 })}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {benchmarkRecap ? (
        (() => {
          const rows = s.patterns
            .filter((p) => p.e1rm > 0 && BENCHMARK_PATTERNS.includes(p.key))
            .map((p) => {
              const prev = (s.beforePatterns ?? []).find((b) => b.key === p.key) ?? null;
              // Only compare against a real previous check, not the first
              // time a lift enters the score (prev e1RM of 0).
              const hadPrev = prev && prev.e1rm > 0;
              return {
                p,
                prev,
                gain: hadPrev ? p.e1rm - prev.e1rm : 0,
                moved: hadPrev && prev.tier && prev.tierIndex !== p.tierIndex,
              };
            });
          const comparable = rows.filter((r) => r.prev && r.prev.e1rm > 0).length;
          const up = rows.filter((r) => r.gain > 0).length;
          return (
            <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-display text-base font-semibold text-fg">Strength Check</h2>
                <span className="text-xs text-dim">
                  {comparable > 0
                    ? `${up} of ${comparable} lift${comparable === 1 ? "" : "s"} up since your last check`
                    : "Your baseline. Re-test in 4 to 6 weeks to see it move."}
                </span>
              </div>
              <ul className="flex flex-col [&>li+li]:border-t [&>li+li]:border-border/70">
                {rows.map(({ p, prev, gain, moved }) => (
                  <li key={p.key} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{p.lift}</span>
                      {moved ? (
                        <span className="text-xs font-semibold">
                          <span className="text-dim">{prev.tier}</span>
                          <span className="text-dim"> to </span>
                          <span style={{ color: tierColorFor(p.tierIndex) }}>{p.tier}</span>
                        </span>
                      ) : (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: tierColorFor(p.tierIndex) }}
                        >
                          {p.tier}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tabular block text-sm font-semibold text-fg">
                        {scoreU(p.e1rm)} {unit}
                      </span>
                      {gain > 0 ? (
                        <span className="tabular block text-xs font-semibold text-good">+{scoreU(gain)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
        <div className={`grid gap-3 ${showLevel ? "grid-cols-2" : "grid-cols-3"}`}>
          <Metric label="Volume" value={`${Math.round(summary.totalVolume)} ${unit}`} />
          <Metric label="Sets" value={summary.totalSets ?? 0} />
          <Metric label="Time" value={timeLabel} />
          {showLevel ? (
            <Metric
              label="Level"
              value={j.level}
              delta={j.xpGained > 0 ? `+${j.xpGained} XP` : null}
            />
          ) : null}
        </div>

        {showLevel ? (
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: j.tierColor }}>
                {j.tier}
              </span>
              <span className="tabular text-dim">
                {j.level >= 100
                  ? "Max level"
                  : `${j.xpToNextLevel.toLocaleString()} XP to Level ${j.level + 1}`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="bar-fill h-full rounded-full"
                style={{ width: `${j.pctToNextLevel}%`, backgroundColor: j.tierColor }}
              />
            </div>
          </div>
        ) : null}

        {established && j?.rankedUp ? (
          <p
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: `${j.tierColor}1f`, color: j.tierColor }}
          >
            <IconLevelUp className="h-4 w-4" />
            New rank: {j.tier}
            {j.leveledUp ? ` · Level ${j.level}` : ""}
          </p>
        ) : established && j?.leveledUp ? (
          <p className="flex items-center gap-1.5 rounded-xl bg-good/10 px-3 py-2.5 text-sm font-semibold text-good">
            <IconLevelUp className="h-4 w-4" />
            Level up. You reached Level {j.level}.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
          How hard was this workout?
          <Explain k="effort" />
        </h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSelectEffort(n)}
              disabled={savingEffort}
              className={`flex-1 rounded-xl py-3 text-[15px] font-semibold transition-[background-color,color,transform] active:scale-95 disabled:opacity-60 ${
                effort === n ? "bg-accent text-black" : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[13px] text-muted">
          <span>{EFFORT_LABELS[1]}</span>
          <span>{EFFORT_LABELS[5]}</span>
        </div>
        {effort ? <p className="text-center text-[14px] font-semibold text-accent">{EFFORT_LABELS[effort]}</p> : null}
      </section>

      <ShareCard summary={summary} timeLabel={timeLabel} unit={unit} effortLabel={effort ? EFFORT_LABELS[effort] : null} muscles={extras?.muscles} />

      <button
        type="button"
        onClick={onDone}
        className="rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98]"
      >
        Done
      </button>

      {saveOpen && canSave ? (
        <SaveWorkoutModal
          defaultName={saveAsWorkout.defaultName}
          exercises={saveAsWorkout.exercises}
          sourceMyWorkoutId={saveAsWorkout.sourceMyWorkoutId}
          sourceName={saveAsWorkout.sourceName}
          modified={saveAsWorkout.modified}
          onClose={() => setSaveOpen(false)}
        />
      ) : null}
    </div>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconBookmark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
      <path d="M12 8v5M9.5 10.5h5" />
    </svg>
  );
}
function IconTrophy(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}
function IconLevelUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconFlame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c1 3-1 4-2 6-1 1.6-.6 3.4.6 4.3.7.5 1.7.3 2-.6.5 1 .4 2.2-.5 3 2-.4 3.4-2.2 3.4-4.4 0-2.3-1.6-4-2.4-5.6C13.9 2.9 13 2 12 2z" />
      <path d="M9 14.5C8 16 8.4 18.6 10 20c1.2 1 3 1 4.2 0 1.4-1.2 1.8-3.4 1-5-.7 1.2-2 1.8-3.2 1.5.5-1.6-.3-3-1.4-4-.3 1-1 1.6-1.6 2z" opacity=".55" />
    </svg>
  );
}

function ExerciseCard({ row, showTips = false, unit = "kg", last, rirTarget = null, beatLabel = null, inlineVideo = false, startHint = null, showRir = true, showFailure = false, onPatch, onPatchSet, onToggleSet, onAddSet, onRemoveSet, onRemove, onSwap, onReorder, onVideo }) {
  const { exercise, sets } = row;
  const embedUrl = inlineVideo && exercise.video_url ? loomEmbedUrl(exercise.video_url) : null;
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
  // Isometric holds (planks and the like) are logged in seconds, with no
  // load: hide the Weight / effort fields and label the middle column
  // "Time".
  const timeBased = isTimeBasedExercise(exercise.name);
  const showWeight = !timeBased;
  const withRir = showRir && !timeBased;
  // Simple mode: no RIR box, just a "taken to failure" tap (stored as
  // RIR 0). Same column slot.
  const withFailure = showFailure && !timeBased;
  const midCol = withRir || withFailure;
  // No delete column: a set is deleted by swiping its row (SwipeRow).
  const gridCls = timeBased
    ? "grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem] items-center gap-2"
    : midCol
      ? "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_3.25rem_2.75rem] items-center gap-2"
      : "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2";
  const workSets = sets.filter((s) => !s.warmup);
  const best1rm = Math.max(0, ...workSets.map((s) => epley1rm(s.weight, s.reps)));
  const volume = workSets.reduce(
    (v, s) => v + (s.completed ? (Number(s.weight) || 0) * (Number(s.reps) || 0) : 0),
    0,
  );
  const [showHistory, setShowHistory] = useState(false);

  const lastLine =
    last && last.sets.length
      ? last.sets
          .filter((s) => s.weight != null || s.reps != null)
          .map(formatSet)
          .join("  ·  ")
      : null;


  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-[17px] font-semibold leading-snug tracking-[-0.01em] text-fg">{exercise.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="flex items-center gap-1.5 text-[13px] text-dim">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(--muscle-${muscleKey(exercise.muscle)})` }}
              />
              {exercise.muscle}
            </span>
            {row.targetSets ? <StatPill label="Sets" value={row.targetSets} /> : null}
            {row.targetReps ? <StatPill label={timeBased ? "Time" : "Reps"} value={row.targetReps} /> : null}
            {rirTarget != null && !timeBased ? <StatPill label="RIR" value={rirTarget} tone="accent" /> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {exercise.video_url && !inlineVideo ? (
            <button
              type="button"
              onClick={onVideo}
              aria-label="Watch form video"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </button>
          ) : null}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Exercise options"
              aria-expanded={menuOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,color,transform] active:scale-90 ${
                menuOpen ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
            </button>
            {menuOpen ? (
              <div className="glass-strong pop-in absolute right-0 top-full z-30 mt-2 flex w-56 origin-top-right flex-col overflow-hidden rounded-2xl py-1.5">
                <MenuItem onClick={() => { setMenuOpen(false); onSwap?.(); }}>Swap exercise</MenuItem>
                {onReorder ? (
                  <MenuItem onClick={() => { setMenuOpen(false); onReorder(); }}>Reorder exercises</MenuItem>
                ) : null}
                {!row.showNote ? (
                  <MenuItem onClick={() => { setMenuOpen(false); onPatch({ showNote: true }); }}>Add a note</MenuItem>
                ) : null}
                <div className="mx-4 my-1 h-px bg-fg/10" />
                <MenuItem danger onClick={() => { setMenuOpen(false); onRemove(); }}>Remove exercise</MenuItem>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {embedUrl ? (
        <div className="relative w-full max-w-[260px] overflow-hidden rounded-xl bg-black">
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={`${exercise.name} form video`}
              loading="lazy"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <button
            type="button"
            onClick={onVideo}
            aria-label="Open video full size"
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white/90 transition-colors hover:bg-black/80"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>
      ) : exercise.video_url && inlineVideo ? (
        <button
          type="button"
          onClick={onVideo}
          className="self-start text-[13px] font-semibold text-accent active:opacity-60"
        >
          Watch form video
        </button>
      ) : null}

      {lastLine ? (
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="-mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] leading-snug transition-colors active:bg-surface-2"
        >
          <IconClock className="h-3.5 w-3.5 shrink-0 text-dim" />
          <span className="min-w-0 flex-1 text-muted">
            <span className={beatLabel ? "font-semibold text-accent" : "font-medium text-dim"}>
              {beatLabel ?? `Last${last?.date ? ` (${last.date})` : ""}`}
            </span>
            <span className="text-dim">{"  "}</span>
            {lastLine}
          </span>
          <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
        </button>
      ) : startHint ? (
        <p className="flex items-start gap-2 text-[13px] leading-snug text-muted">
          <span aria-hidden="true" className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {startHint}
        </p>
      ) : null}

      {showHistory ? (
        <LastNumbers
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          unit={unit}
          onClose={() => setShowHistory(false)}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        <div className={`${gridCls} px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-dim`}>
          <span className="text-center">Set</span>
          {showWeight ? <span className="text-center">{unit}</span> : null}
          <span className="text-center">{timeBased ? "Secs" : "Reps"}</span>
          {withRir ? (
            <span className="flex items-center justify-center gap-0.5">RIR <Explain k="rir" label="RIR" /></span>
          ) : withFailure ? (
            <span className="flex items-center justify-center gap-0.5">
              <IconFlame className="h-3 w-3" /> <Explain k="failure" label="to failure" />
            </span>
          ) : null}
          <span />
        </div>

        {sets.map((set, i) => {
          const failed = set.rir === "0" || set.rir === 0;
          // A logged set reads as "printed": the input wells drop away and
          // the row takes a soft accent tint (layered over the solid
          // surface, so the swipe action underneath never shows through).
          const inputCls = `h-11 w-full min-w-0 rounded-xl text-center text-[17px] font-semibold tabular-nums text-fg outline-none transition-colors placeholder:text-dim focus:bg-surface-2 focus:ring-2 focus:ring-accent/60 ${
            set.completed ? "bg-transparent" : "bg-surface-2"
          }`;
          return (
            <SwipeRow
              key={i}
              onDelete={() => onRemoveSet(i)}
              deleteLabel={`Delete set ${i + 1}`}
              className={
                set.completed
                  ? "bg-surface [background-image:linear-gradient(var(--color-accent-soft),var(--color-accent-soft))]"
                  : "bg-surface"
              }
            >
              <div className={`${gridCls} px-1 py-1 ${set.warmup ? "opacity-60" : ""}`}>
                <button
                  type="button"
                  onClick={() => onPatchSet(i, { warmup: !set.warmup })}
                  aria-label={set.warmup ? "Warm-up set. Make it a working set" : "Working set. Mark as warm-up"}
                  aria-pressed={set.warmup}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-colors ${
                    set.warmup ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {set.warmup ? "W" : sets.slice(0, i + 1).filter((x) => !x.warmup).length}
                </button>
                {showWeight ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    value={set.weight}
                    onChange={(e) => onPatchSet(i, { weight: e.target.value })}
                    onFocus={selectOnFocus}
                    aria-label={`Set ${i + 1} weight`}
                    className={inputCls}
                  />
                ) : null}
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => onPatchSet(i, { reps: e.target.value })}
                  onFocus={selectOnFocus}
                  aria-label={`Set ${i + 1} ${timeBased ? "seconds" : "reps"}`}
                  className={inputCls}
                />
                {withRir ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.rir}
                    onChange={(e) => onPatchSet(i, { rir: e.target.value })}
                    onFocus={selectOnFocus}
                    aria-label={`Set ${i + 1} reps in reserve`}
                    className={inputCls}
                  />
                ) : withFailure ? (
                  <button
                    type="button"
                    onClick={() => onPatchSet(i, { rir: failed ? "" : "0" })}
                    aria-pressed={failed}
                    aria-label={`Set ${i + 1} taken to failure`}
                    className={`flex h-11 w-full items-center justify-center rounded-xl transition-[background-color,color,transform] active:scale-95 ${
                      failed ? "bg-accent text-black" : set.completed ? "text-dim" : "bg-surface-2 text-dim"
                    }`}
                  >
                    <IconFlame className="h-[18px] w-[18px]" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    // A light tick on the same frame the check lands
                    // (Android; iOS Safari has no vibration API).
                    if (!set.completed) navigator.vibrate?.(10);
                    onToggleSet(i);
                  }}
                  aria-label={set.completed ? "Mark set not done" : "Mark set done"}
                  aria-pressed={set.completed}
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-[background-color,color] duration-150 ${
                    set.completed ? "check-pop bg-accent text-black" : "bg-surface-2 text-dim hover:text-fg"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </SwipeRow>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAddSet}
          className="flex items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-[14px] font-semibold text-accent transition-transform active:scale-95"
        >
          <IconPlus /> Add set
        </button>
        {volume > 0 ? (
          <span className="text-right text-[12px] tabular-nums text-dim">
            Vol {Math.round(volume).toLocaleString("en-GB")} {unit}
            {best1rm ? ` · 1RM ~${Math.round(best1rm)} ${unit}` : ""}
          </span>
        ) : null}
      </div>
      {showTips ? (
        <p className="text-[12px] leading-snug text-dim">
          Tap a set number for a warm-up. Swipe left to delete.{" "}
          <span className="inline-flex align-middle">
            <Explain k="warmup" />
          </span>
        </p>
      ) : null}

      {row.showNote ? (
        <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
          <textarea
            value={row.note}
            onChange={(e) => onPatch({ note: e.target.value })}
            rows={2}
            autoFocus
            placeholder="Cues, tempo, how it felt."
            className="w-full resize-y bg-transparent text-[15px] text-fg placeholder:text-dim focus:outline-none"
          />
          {!row.note ? (
            <button
              type="button"
              onClick={() => onPatch({ showNote: false })}
              aria-label="Remove note"
              className="shrink-0 rounded-full p-1 text-dim hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MenuItem({ onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-fg/5 active:bg-fg/10 ${
        danger ? "text-danger" : "text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-medium text-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}
function Metric({ label, value, delta }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="tabular truncate text-[20px] font-bold leading-tight text-fg">{value}</span>
      {delta ? <span className="tabular text-[12px] font-semibold text-good">{delta}</span> : null}
    </div>
  );
}
function IconPlus() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function IconPause(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>;
}
function IconPlay(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5.5v13l11-6.5z" /></svg>;
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
