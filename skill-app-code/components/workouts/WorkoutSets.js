"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSet } from "@/lib/training";
import { roundForInput, toKg } from "@/lib/units";
import MusclePill from "@/components/MusclePill";
import DeleteWorkoutButton from "@/components/workouts/DeleteWorkoutButton";
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
      <div className="flex flex-col gap-4">
        {exercises.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
            No sets were logged for this session.
          </p>
        ) : (
          exercises.map((ex) => (
            <section
              key={ex.exercise?.id ?? ex.note}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-fg">
                  {ex.exercise?.name ?? "Exercise"}
                </span>
                {ex.exercise?.muscle ? <MusclePill muscle={ex.exercise.muscle} /> : null}
              </div>
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
                {ex.sets.map((s) => (
                  <li
                    key={s.id}
                    className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${
                      s.completed ? "bg-accent-soft text-fg" : "bg-bg/40 text-dim"
                    }`}
                  >
                    <span className="text-dim">Set {s.setNumber}</span>
                    <span className="tabular">{formatSet(s, unit)}</span>
                    {!s.completed ? <span className="text-xs">not completed</span> : null}
                  </li>
                ))}
              </ul>
              {ex.note ? <p className="text-sm text-muted">{ex.note}</p> : null}
            </section>
          ))
        )}

        <div className="flex flex-wrap items-center gap-2">
          {exercises.length > 0 ? (
            <button
              type="button"
              onClick={startEdit}
              className="self-start rounded-field border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
            >
              Edit numbers
            </button>
          ) : null}
          <DeleteWorkoutButton sessionId={sessionId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-card border border-accent/30 bg-accent-soft p-4">
        <p className="text-xs text-muted">
          Fix a typo in any set below, or correct the name and date. Nothing changes until you save.
        </p>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Workout name
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Date
          <div className="overflow-hidden rounded-field border border-border bg-bg focus-within:border-accent">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full appearance-none bg-transparent px-3 py-2 text-sm text-fg outline-none"
            />
          </div>
        </label>
      </div>

      {exercises.map((ex) => (
        <section
          key={ex.exercise?.id ?? ex.note}
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
        >
          <span className="font-display text-base font-semibold text-fg">
            {ex.exercise?.name ?? "Exercise"}
          </span>
          <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2rem] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dim">
            <span>#</span>
            <span>Weight ({unit})</span>
            <span>Reps</span>
            <span className="text-center">RIR</span>
            <span className="text-center">Done</span>
          </div>
          {ex.sets.map((s) => {
            const v = form.sets[s.id] ?? { weight: "", reps: "", rir: "", completed: true };
            return (
              <div
                key={s.id}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem_2rem] items-center gap-1.5"
              >
                <span className="tabular text-sm text-dim">{s.setNumber}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={v.weight}
                  onChange={(e) => patchSet(s.id, { weight: e.target.value })}
                  aria-label={`Set ${s.setNumber} weight`}
                  className="tabular w-full rounded-field border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={v.reps}
                  onChange={(e) => patchSet(s.id, { reps: e.target.value })}
                  aria-label={`Set ${s.setNumber} reps`}
                  className="tabular w-full rounded-field border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={v.rir}
                  onChange={(e) => patchSet(s.id, { rir: e.target.value })}
                  aria-label={`Set ${s.setNumber} reps in reserve`}
                  className="tabular w-full rounded-field border border-border bg-bg px-1.5 py-1.5 text-center text-sm text-fg focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => patchSet(s.id, { completed: !v.completed })}
                  aria-pressed={v.completed}
                  aria-label={v.completed ? "Mark set not done" : "Mark set done"}
                  className={`flex h-8 w-8 items-center justify-center justify-self-center rounded-field border transition-colors ${
                    v.completed ? "border-accent bg-accent text-black" : "border-border text-dim hover:text-fg"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            );
          })}
        </section>
      ))}

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-field bg-accent px-5 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
