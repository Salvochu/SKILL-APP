"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { roundForInput, toKg, formatWeight } from "@/lib/units";
import { muscleKey, isTimeBasedExercise } from "@/lib/exercises";
import DeleteWorkoutButton from "@/components/workouts/DeleteWorkoutButton";
import { Group, Row, rowInput } from "@/components/ui/Grouped";
import { updateWorkoutSession } from "@/app/(app)/workouts/actions";

// The exercises + sets of one past session, with an "Edit numbers" mode
// for fixing a mistyped weight, rep count or RIR (or the name / date)
// after the fact. Editing changes existing sets only; adding or removing
// sets and exercises is not offered here.
export default function WorkoutSets({ sessionId, title, dateOnly, exercises, unit }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);

  function startEdit() {
    const sets = {};
    for (const ex of exercises) {
      for (const s of ex.sets) {
        sets[s.id] = {
          weight: s.weight == null ? "" : roundForInput(s.weight, unit),
          reps: s.reps == null ? "" : String(s.reps),
          rir: s.rir == null ? "" : String(s.rir),
          completed: s.completed !== false,
          warmup: s.isWarmup === true,
        };
      }
    }
    setForm({ title, date: dateOnly, sets });
    setError(null);
    setEditing(true);
  }

  function patchSet(id, patch) {
    setForm((f) => ({ ...f, sets: { ...f.sets, [id]: { ...f.sets[id], ...patch } } }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      date: form.date,
      sets: Object.entries(form.sets).map(([id, s]) => ({
        id,
        weight: s.weight === "" ? "" : toKg(s.weight, unit),
        reps: s.reps,
        rir: s.rir,
        completed: s.completed,
        warmup: s.warmup === true,
      })),
    };
    const res = await updateWorkoutSession(sessionId, payload);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
            Exercises{exercises.length ? ` (${exercises.length})` : ""}
          </h2>
          {exercises.length > 0 ? (
            <button
              type="button"
              onClick={startEdit}
              className="text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
            >
              Edit
            </button>
          ) : null}
        </div>

        {exercises.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-[15px] text-muted">
            No sets were logged for this session.
          </p>
        ) : (
          exercises.map((ex) => (
            <section key={ex.exercise?.id ?? ex.note} className="flex flex-col gap-1.5 rounded-2xl bg-surface px-4 pb-2 pt-4">
              <ExerciseHeading exercise={ex.exercise} />
              {/* The sets as plain rows with hairlines, no box inside the card. */}
              <ul className="[&>li+li]:border-t [&>li+li]:border-border/70">
                {ex.sets.map((s, idx) => (
                  <li key={s.id} className={`flex items-center gap-3 py-2.5 ${s.isWarmup ? "opacity-60" : ""}`}>
                    <span className="w-[4.25rem] shrink-0 text-[13px] text-dim">
                      {s.isWarmup ? "Warm-up" : `Set ${ex.sets.slice(0, idx + 1).filter((x) => !x.isWarmup).length}`}
                    </span>
                    <span className="min-w-0 flex-1 text-[16px] font-semibold tabular-nums text-fg">
                      {isTimeBasedExercise(ex.exercise?.name ?? "") ? (
                        // A hold (plank and the like): the number is seconds.
                        <>
                          {s.reps == null ? "?" : s.reps}
                          <span className="ml-0.5 text-[13px] font-semibold text-muted">s</span>
                        </>
                      ) : (
                        <>
                          {s.weight == null ? "BW" : formatWeight(s.weight, unit)}
                          <span className="mx-1.5 font-normal text-dim">×</span>
                          {s.reps == null ? "?" : s.reps}
                        </>
                      )}
                      {s.rir != null ? (
                        <span className="ml-2 text-[13px] font-medium text-dim">RIR {s.rir}</span>
                      ) : null}
                    </span>
                    {s.isWarmup ? null : s.completed ? (
                      <span aria-label="Completed" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                        <IconCheck className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[12px] text-dim">Not done</span>
                    )}
                  </li>
                ))}
              </ul>
              {ex.note ? <p className="pb-2 text-[14px] leading-snug text-muted">{ex.note}</p> : null}
            </section>
          ))
        )}

        <DeleteWorkoutButton sessionId={sessionId} />
      </div>
    );
  }

  const grid = "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_3.25rem_2.75rem] items-center gap-2";
  const inputCls =
    "h-11 w-full min-w-0 rounded-xl bg-surface-2 text-center text-[17px] font-semibold tabular-nums text-fg outline-none focus:ring-2 focus:ring-accent/60";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Group>
          <Row label="Name" htmlFor="ws-name">
            <input
              id="ws-name"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={rowInput}
            />
          </Row>
          <Row label="Date" htmlFor="ws-date">
            {/* iOS Safari's date control can paint wider than its box;
               overflow-hidden keeps it inside the row. */}
            <div className="flex w-full min-w-0 justify-end overflow-hidden">
              <input
                id="ws-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="min-w-0 appearance-none bg-transparent py-3 text-right text-[16px] text-muted outline-none focus:text-fg [&::-webkit-date-and-time-value]:text-right"
              />
            </div>
          </Row>
        </Group>
        <p className="px-4 text-[13px] leading-snug text-dim">
          Fix a typo in any set, or correct the name and date. Nothing changes until you save.
        </p>
      </div>

      {exercises.map((ex) => (
        <section key={ex.exercise?.id ?? ex.note} className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
          <ExerciseHeading exercise={ex.exercise} />
          <div className={`${grid} px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-dim`}>
            <span className="text-center">Set</span>
            <span className="text-center">{unit}</span>
            <span className="text-center">{isTimeBasedExercise(ex.exercise?.name ?? "") ? "Secs" : "Reps"}</span>
            <span className="text-center">RIR</span>
            <span className="text-center">Done</span>
          </div>
          {ex.sets.map((s, idx) => {
            const v = form.sets[s.id] ?? { weight: "", reps: "", rir: "", completed: true, warmup: false };
            const workNo = ex.sets
              .slice(0, idx + 1)
              .filter((x) => !(form.sets[x.id]?.warmup ?? x.isWarmup)).length;
            return (
              <div key={s.id} className={`${grid} px-1 ${v.warmup ? "opacity-60" : ""}`}>
                <button
                  type="button"
                  onClick={() => patchSet(s.id, { warmup: !v.warmup })}
                  aria-pressed={v.warmup}
                  aria-label={v.warmup ? "Warm-up set. Make it a working set" : "Working set. Mark as warm-up"}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-colors ${
                    v.warmup ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {v.warmup ? "W" : workNo}
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  value={v.weight}
                  onChange={(e) => patchSet(s.id, { weight: e.target.value })}
                  aria-label={`Set ${s.setNumber} weight`}
                  className={inputCls}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={v.reps}
                  onChange={(e) => patchSet(s.id, { reps: e.target.value })}
                  aria-label={`Set ${s.setNumber} reps`}
                  className={inputCls}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={v.rir}
                  onChange={(e) => patchSet(s.id, { rir: e.target.value })}
                  aria-label={`Set ${s.setNumber} reps in reserve`}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => patchSet(s.id, { completed: !v.completed })}
                  aria-pressed={v.completed}
                  aria-label={v.completed ? "Mark set not done" : "Mark set done"}
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    v.completed ? "bg-accent text-black" : "bg-surface-2 text-dim hover:text-fg"
                  }`}
                >
                  <IconCheck className="h-[18px] w-[18px]" />
                </button>
              </div>
            );
          })}
        </section>
      ))}

      {error ? <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[14px] text-danger">{error}</p> : null}

      {/* Save and Cancel float above the tab bar while you edit. */}
      <div className="sticky bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-30 flex gap-2 md:bottom-4">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="glass rounded-2xl px-5 py-4 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-2xl bg-accent py-4 text-center text-[16px] font-semibold text-black shadow-[0_12px_30px_-10px_rgba(252,118,5,0.55)] transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function ExerciseHeading({ exercise }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="font-sans text-[17px] font-semibold leading-snug tracking-[-0.01em] text-fg">
        {exercise?.name ?? "Exercise"}
      </h3>
      {exercise?.muscle ? (
        <span className="flex items-center gap-1.5 text-[13px] text-dim">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: `var(--muscle-${muscleKey(exercise.muscle)})` }}
          />
          {exercise.muscle}
        </span>
      ) : null}
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
