"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MusclePill from "@/components/MusclePill";
import ConfirmModal from "@/components/ConfirmModal";
import ExercisePicker from "@/components/log/ExercisePicker";
import ReorderSheet from "@/components/log/ReorderSheet";
import {
  createMyWorkout,
  updateMyWorkout,
  duplicateMyWorkout,
  deleteMyWorkout,
} from "@/app/(app)/workouts/my-actions";

let keySeq = 0;
const nextKey = () => `w${Date.now().toString(36)}${++keySeq}`;

// The screen for building or editing a custom workout: a name, an
// optional note, and an ordered list of exercises with target sets and
// reps. Shares the logger's exercise picker (muscle / equipment filters)
// and its drag-to-reorder sheet.
export default function WorkoutBuilder({ allExercises, initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [name, setName] = useState(initial.name ?? "");
  const [note, setNote] = useState(initial.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(initial.note));
  const [rows, setRows] = useState(() =>
    (initial.exercises ?? []).map((e) => ({
      key: nextKey(),
      exercise: e.exercise,
      sets: e.sets ?? 3,
      reps: e.reps ?? "",
    })),
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null); // "duplicate" | "delete"
  const [error, setError] = useState(null);

  function addExercise(exercise) {
    // The picker closes itself once, after every pick is added.
    setRows((rs) => [...rs, { key: nextKey(), exercise, sets: 3, reps: "" }]);
  }
  function patchRow(key, patch) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  const payload = () => ({
    name,
    note: showNote ? note : "",
    exercises: rows.map((r) => ({ exerciseId: r.exercise.id, sets: r.sets, reps: r.reps })),
  });

  async function onSave() {
    setError(null);
    if (!name.trim()) return setError("Give this workout a name.");
    if (rows.length === 0) return setError("Add at least one exercise.");
    setSaving(true);
    const result = isEdit
      ? await updateMyWorkout(initial.id, payload())
      : await createMyWorkout(payload());
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/splits");
    router.refresh();
  }

  async function onDuplicate() {
    setBusy("duplicate");
    const result = await duplicateMyWorkout(initial.id);
    if (result?.error) {
      setError(result.error);
      setBusy(null);
      return;
    }
    router.push(`/workouts/mine/${result.id}`);
    router.refresh();
  }

  async function onDelete() {
    setBusy("delete");
    const result = await deleteMyWorkout(initial.id);
    if (result?.error) {
      setError(result.error);
      setBusy(null);
      setConfirmDelete(false);
      return;
    }
    router.push("/splits");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-fg">{isEdit ? "Edit workout" : "Build a workout"}</h1>
          <p className="text-sm text-muted">
            Pick your exercises and targets. Start it any day from the Train tab.
          </p>
        </div>
        {isEdit ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Workout options"
              aria-expanded={menuOpen}
              className="rounded-field border border-border bg-surface p-1.5 text-muted transition-colors hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 top-full z-20 mt-1 flex w-44 flex-col overflow-hidden rounded-card border border-border bg-surface py-1 shadow-lg">
                  <button
                    type="button"
                    disabled={busy != null}
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate();
                    }}
                    className="px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
                  >
                    {busy === "duplicate" ? "Duplicating..." : "Duplicate"}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    disabled={busy != null}
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    className="px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                  >
                    Delete workout
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Workout name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push day, Arms, Full body A..."
            className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
          />
        </label>

        {showNote ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
            Note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Anything you want to remember about this one."
              className="w-full resize-y rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="self-start text-xs font-medium text-accent hover:underline"
          >
            Add a note
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
            Exercises{rows.length ? ` (${rows.length})` : ""}
          </h2>
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => setReorderOpen(true)}
              className="text-xs font-medium text-accent hover:underline"
            >
              Reorder
            </button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-8">
            <p className="text-sm text-muted">No exercises yet.</p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
            >
              Add exercise
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-display text-base font-semibold text-fg">
                      {row.exercise.name}
                    </span>
                    <span className="mt-1 block">
                      <MusclePill muscle={row.exercise.muscle} />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label={`Remove ${row.exercise.name}`}
                    className="shrink-0 rounded-field p-1.5 text-dim transition-colors hover:text-danger"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">Sets</span>
                    <div className="flex items-center gap-1.5">
                      <Stepper
                        label="One fewer set"
                        onClick={() => patchRow(row.key, { sets: Math.max(1, row.sets - 1) })}
                      >
                        &minus;
                      </Stepper>
                      <span className="tabular w-6 text-center text-sm font-semibold text-fg">{row.sets}</span>
                      <Stepper
                        label="One more set"
                        onClick={() => patchRow(row.key, { sets: Math.min(20, row.sets + 1) })}
                      >
                        +
                      </Stepper>
                    </div>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-dim">Reps target</span>
                    <input
                      value={row.reps}
                      onChange={(e) => patchRow(row.key, { reps: e.target.value })}
                      placeholder="8 to 12"
                      className="tabular w-28 rounded-field border border-border bg-bg px-2 py-1.5 text-sm text-fg placeholder:text-dim focus:border-accent"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-sm font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add another exercise
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 flex gap-2 md:bottom-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-field border border-border bg-surface px-4 py-3 text-sm font-semibold text-muted transition-colors hover:text-fg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-field bg-accent py-3 text-center font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Save workout"}
        </button>
      </div>

      {pickerOpen ? (
        <ExercisePicker
          exercises={allExercises}
          multiple
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
      {reorderOpen ? (
        <ReorderSheet
          rows={rows}
          onSave={(next) => {
            setRows(next);
            setReorderOpen(false);
          }}
          onClose={() => setReorderOpen(false)}
        />
      ) : null}
      {confirmDelete ? (
        <ConfirmModal
          title="Delete this workout?"
          message="It will be removed from your Train tab. Sessions you have already logged from it are not affected."
          confirmLabel={busy === "delete" ? "Deleting..." : "Delete it"}
          cancelLabel="Keep it"
          danger
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </div>
  );
}

function Stepper({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-field border border-border bg-bg text-base font-semibold text-fg transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
