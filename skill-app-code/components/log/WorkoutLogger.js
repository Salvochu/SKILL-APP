"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkout } from "@/app/(app)/log/actions";
import RestTimer from "@/components/log/RestTimer";
import ExercisePicker from "@/components/log/ExercisePicker";
import VideoModal from "@/components/log/VideoModal";
import MusclePill from "@/components/MusclePill";
import { formatSet } from "@/lib/training";
import { queueWorkout, isLikelyNetworkError } from "@/lib/offlineQueue";

let keySeq = 0;
const nextKey = () => `x${++keySeq}`;

function epley1rm(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r) return 0;
  return w * (1 + r / 30);
}

function formatElapsed(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function makeExercise(exercise, targetSets = 3, targetReps = "") {
  return {
    key: nextKey(),
    exercise,
    note: "",
    showNote: false,
    sets: Array.from({ length: Math.max(1, targetSets) }, () => ({
      weight: "",
      reps: "",
      rir: "",
      completed: false,
    })),
    targetReps,
  };
}

export default function WorkoutLogger({ allExercises, history = {}, mesoContext = null, initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  // Real elapsed time, not a typed guess: starts the moment this screen
  // mounts (this is "starting the workout") and becomes the saved
  // duration. startedAt is captured once; `now` just ticks the display.
  // pausedAt is the timestamp of the current pause (null while running);
  // pausedTotalMs is the sum of every earlier pause, so time spent
  // paused is excluded from the saved duration.
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [pausedAt, setPausedAt] = useState(null);
  const [pausedTotalMs, setPausedTotalMs] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState(() =>
    initial.exercises.map((e) => makeExercise(e.exercise, e.sets, e.reps)),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [videoFor, setVideoFor] = useState(null);
  const [restKey, setRestKey] = useState(0);
  const [restSeconds, setRestSeconds] = useState(90);
  const [showRest, setShowRest] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  useEffect(() => {
    if (pausedAt || finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausedAt, finished]);

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
            (s, set) => s + (set.completed ? (Number(set.weight) || 0) * (Number(set.reps) || 0) : 0),
            0,
          ),
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
    if (next) {
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
    setRows((rs) => [...rs, makeExercise(exercise)]);
    setPickerOpen(false);
  }
  function removeExercise(key) {
    setRows((rs) => rs.filter((r) => r.key !== key));
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
      notes,
      splitId: initial.splitId,
      dayTemplateId: initial.dayTemplateId,
      variant: initial.variant,
      userMesocycleId: initial.userMesocycleId,
      exercises: rows.map((r) => ({
        exerciseId: r.exercise.id,
        note: r.note,
        sets: r.sets.map((s) => ({ weight: s.weight, reps: s.reps, rir: s.rir, completed: s.completed })),
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
      router.push("/dashboard");
    } catch (err) {
      if (isLikelyNetworkError(err)) {
        // No connection right now, most likely at the gym. Keep the
        // typed sets on this device instead of losing them; a background
        // sync (components/OfflineQueueSync.js) replays it once the
        // connection is back. The workout is considered done at this
        // point, so the clock stays stopped.
        queueWorkout(payload);
        setSaving(false);
        setSavedOffline(true);
        return;
      }
      setError("Something went wrong saving this workout. Try again.");
      setSaving(false);
      resumeAfterFailedSave();
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Log Workout</h1>
        <p className="text-sm text-muted">Add exercises, enter your sets, and save to your history.</p>
      </header>

      {mesoContext ? (
        <div className="flex items-center gap-3 rounded-card border border-accent/40 bg-accent-soft px-4 py-3">
          <span className="text-sm font-semibold text-accent">
            Week {mesoContext.week} of {mesoContext.weeks}
          </span>
          <span className="text-sm text-accent">
            {mesoContext.isDeload ? "Deload, take it easy" : `Target effort: RIR ${mesoContext.rirTarget}`}
          </span>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
        <Field label="Workout name">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date" className="min-w-0">
            {/* iOS Safari's native date control can paint wider than the
               width it is given. overflow-hidden on this wrapper clips it
               to the box regardless; the input itself is borderless so
               the wrapper's border is the only one drawn. */}
            <div className="w-full min-w-0 overflow-hidden rounded-field border border-border bg-bg focus-within:border-accent">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-fg outline-none"
              />
            </div>
          </Field>
          <Field label="Session time" className="min-w-0">
            <div className="flex w-full min-w-0 items-center gap-2 rounded-field border border-border bg-bg py-1.5 pl-3 pr-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  pausedAt || finished ? "bg-dim" : "animate-pulse bg-accent"
                }`}
                aria-hidden="true"
              />
              <span className="tabular text-sm text-fg">{formatElapsed(elapsedSeconds)}</span>
              <span className="flex-1 text-xs text-dim">
                {finished ? "stopped" : pausedAt ? "paused" : "recording"}
              </span>
              {!finished ? (
                <button
                  type="button"
                  onClick={togglePause}
                  aria-label={pausedAt ? "Resume timer" : "Pause timer"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-field text-dim transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {pausedAt ? <IconPlay className="h-4 w-4" /> : <IconPause className="h-4 w-4" />}
                </button>
              ) : null}
            </div>
          </Field>
        </div>
        <Field label="Session notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How the session went, energy, anything to remember."
            className="w-full resize-y rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
          />
        </Field>
      </section>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-8">
          <p className="text-sm text-muted">No exercises added yet.</p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Add exercise
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <ExerciseCard
              key={row.key}
              row={row}
              last={history[row.exercise.id] ?? null}
              onPatch={(p) => patchRow(row.key, p)}
              onPatchSet={(i, p) => patchSet(row.key, i, p)}
              onToggleSet={(i) => toggleSet(row.key, i)}
              onAddSet={() => addSet(row.key)}
              onRemoveSet={(i) => removeSet(row.key, i)}
              onRemove={() => removeExercise(row.key)}
              onVideo={() => setVideoFor(row.exercise)}
            />
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <IconPlus /> Add another exercise
          </button>
        </div>
      )}

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {savedOffline ? (
        <p className="rounded-field border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent">
          No connection right now. This workout is saved on this device and will sync automatically once
          you are back online.
        </p>
      ) : null}

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] flex items-center gap-4 rounded-card border border-border bg-surface p-4 md:bottom-4">
        <span className="flex flex-col">
          <span className="text-xs text-dim">Total volume</span>
          <span className="tabular text-lg font-bold text-fg">{Math.round(totalVolume)} kg</span>
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || savedOffline}
          className="ml-auto rounded-field bg-accent px-5 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {savedOffline ? "Saved on this device" : saving ? "Saving..." : "Save Workout"}
        </button>
      </div>

      {pickerOpen ? (
        <ExercisePicker exercises={allExercises} onPick={addExercise} onClose={() => setPickerOpen(false)} />
      ) : null}
      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
      {showRest ? (
        <RestTimer key={restKey} startSeconds={restSeconds} onDismiss={() => setShowRest(false)} />
      ) : null}
    </div>
  );
}

function ExerciseCard({ row, last, onPatch, onPatchSet, onToggleSet, onAddSet, onRemoveSet, onRemove, onVideo }) {
  const { exercise, sets } = row;
  const best1rm = Math.max(0, ...sets.map((s) => epley1rm(s.weight, s.reps)));
  const volume = sets.reduce((v, s) => v + (s.completed ? (Number(s.weight) || 0) * (Number(s.reps) || 0) : 0), 0);

  const lastLine =
    last && last.sets.length
      ? last.sets
          .filter((s) => s.weight != null || s.reps != null)
          .map(formatSet)
          .join("  .  ")
      : null;

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className="font-display text-base font-semibold text-fg">{exercise.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <MusclePill muscle={exercise.muscle} />
            {row.targetReps ? <span className="text-xs text-dim">target {row.targetReps}</span> : null}
          </span>
        </div>
        {exercise.video_url ? (
          <button type="button" onClick={onVideo} aria-label="Watch form video" className="rounded-field p-1.5 text-dim hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          </button>
        ) : null}
        <button type="button" onClick={onRemove} aria-label="Remove exercise" className="rounded-field p-1.5 text-dim hover:text-danger">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      {lastLine ? (
        <div className="rounded-field border border-border bg-bg/40 px-3 py-2">
          <span className="tabular text-xs text-muted">
            <span className="text-dim">Last{last?.date ? ` (${last.date})` : ""}:</span> {lastLine}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2.25rem_1.5rem] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dim">
        <span>Set</span>
        <span>Weight</span>
        <span>Reps</span>
        <span className="text-center">RIR</span>
        <span className="text-center">Log</span>
        <span />
      </div>
      {sets.map((set, i) => {
        const fieldCls = set.completed
          ? "border-accent/50 bg-accent-soft"
          : "border-border bg-bg";
        return (
        <div
          key={i}
          className={`grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2.25rem_1.5rem] items-center gap-1.5 rounded-field -mx-1.5 px-1.5 py-1 transition-colors ${
            set.completed ? "bg-accent-soft" : ""
          }`}
        >
          <span className="tabular text-sm text-dim">{i + 1}</span>
          <input
            type="number"
            inputMode="decimal"
            value={set.weight}
            onChange={(e) => onPatchSet(i, { weight: e.target.value })}
            className={`tabular w-full rounded-field border px-2 py-1.5 text-sm text-fg focus:border-accent ${fieldCls}`}
          />
          <input
            type="number"
            inputMode="numeric"
            value={set.reps}
            onChange={(e) => onPatchSet(i, { reps: e.target.value })}
            className={`tabular w-full rounded-field border px-2 py-1.5 text-sm text-fg focus:border-accent ${fieldCls}`}
          />
          <input
            type="number"
            inputMode="numeric"
            value={set.rir}
            onChange={(e) => onPatchSet(i, { rir: e.target.value })}
            aria-label={`Set ${i + 1} reps in reserve`}
            className={`tabular w-full rounded-field border px-1.5 py-1.5 text-center text-sm text-fg focus:border-accent ${fieldCls}`}
          />
          <button
            type="button"
            onClick={() => onToggleSet(i)}
            aria-label={set.completed ? "Mark set not done" : "Mark set done"}
            aria-pressed={set.completed}
            className={`flex h-8 w-8 items-center justify-center justify-self-center rounded-field border transition-colors ${
              set.completed ? "border-accent bg-accent text-black" : "border-border text-dim hover:text-fg"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </button>
          <button type="button" onClick={() => onRemoveSet(i)} aria-label="Delete set" className="justify-self-center rounded-field p-1 text-dim hover:text-danger">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          </button>
        </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button type="button" onClick={onAddSet} className="flex items-center gap-1 rounded-field border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface-2">
          <IconPlus /> Add set
        </button>
        {volume > 0 ? (
          <span className="tabular text-xs text-dim">
            Vol {Math.round(volume)} kg{best1rm ? ` . 1RM ~${Math.round(best1rm)} kg` : ""}
          </span>
        ) : null}
      </div>

      {row.showNote ? (
        <div className="rounded-field border border-border bg-bg/40 p-2">
          <textarea
            value={row.note}
            onChange={(e) => onPatch({ note: e.target.value })}
            rows={2}
            placeholder="Cues, tempo, how it felt."
            className="w-full resize-y bg-transparent text-sm text-fg placeholder:text-dim focus:outline-none"
          />
        </div>
      ) : (
        <button type="button" onClick={() => onPatch({ showNote: true })} className="flex items-center gap-1.5 self-start text-xs font-medium text-dim hover:text-fg">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H8l-4 4z" /></svg>
          Add note
        </button>
      )}
    </section>
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
function IconPlus() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function IconPause(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>;
}
function IconPlay(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5.5v13l11-6.5z" /></svg>;
}
