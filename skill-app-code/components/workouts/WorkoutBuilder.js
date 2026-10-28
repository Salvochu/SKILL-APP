"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SwipeRow from "@/components/log/SwipeRow";
import { Group } from "@/components/ui/Grouped";
import { muscleKey } from "@/lib/exercises";
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
    note,
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
    <div className="flex flex-col gap-7 py-2">
      {/* iOS large-title layout: Cancel and options up top, the title on
          its own line, and Save floating above the tab bar. */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-1 rounded-lg px-1 py-1 text-[16px] font-medium text-accent transition-opacity active:opacity-50"
          >
            Cancel
          </button>
          {isEdit ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Workout options"
                aria-expanded={menuOpen}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,color,transform] active:scale-90 ${
                  menuOpen ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"
                }`}
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
                  <div className="glass-strong pop-in absolute right-0 top-full z-20 mt-2 flex w-56 origin-top-right flex-col overflow-hidden rounded-2xl py-1.5">
                    <MenuButton
                      disabled={busy != null}
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate();
                      }}
                    >
                      {busy === "duplicate" ? "Duplicating..." : "Duplicate"}
                    </MenuButton>
                    <div className="mx-4 my-1 h-px bg-fg/10" />
                    <MenuButton
                      danger
                      disabled={busy != null}
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                    >
                      Delete workout
                    </MenuButton>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          {isEdit ? "Edit workout" : "Build a workout"}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Pick your exercises and targets. Start it any day from the Train tab.
        </p>
      </header>

      <Group>
        <div className="px-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workout name"
            placeholder="Push day, Arms, Full body A..."
            className="w-full bg-transparent py-3.5 text-[17px] font-semibold text-fg outline-none placeholder:font-normal placeholder:text-dim"
          />
        </div>
        <div className="px-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Note"
            rows={2}
            placeholder="Add a note (optional)"
            className="block w-full resize-none bg-transparent py-3 text-[16px] leading-snug text-fg outline-none placeholder:text-dim"
          />
        </div>
      </Group>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
            Exercises{rows.length ? ` (${rows.length})` : ""}
          </h2>
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => setReorderOpen(true)}
              className="text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
            >
              Reorder
            </button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <IconPlus className="h-5 w-5" />
            </span>
            <p className="text-[15px] text-muted">No exercises yet.</p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-full bg-accent px-5 py-2.5 text-[15px] font-semibold text-black transition-transform active:scale-[0.97]"
            >
              Add exercise
            </button>
          </div>
        ) : (
          <>
            {/* One grouped list: each exercise is a row (swipe left to
                remove), with an iOS-style "Add" row at the end. */}
            <div className="overflow-hidden rounded-2xl bg-surface">
              <ul className="[&>li+li]:border-t [&>li+li]:border-border/70">
                {rows.map((row, i) => (
                  <li key={row.key}>
                    <SwipeRow
                      rounded="rounded-none"
                      onDelete={() => removeRow(row.key)}
                      deleteLabel={`Remove ${row.exercise.name}`}
                      actionLabel="Remove"
                      className="bg-surface"
                    >
                      <ExerciseRow row={row} index={i} onPatch={(patch) => patchRow(row.key, patch)} />
                    </SwipeRow>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex w-full items-center gap-3 border-t border-border/70 px-4 py-3.5 text-left text-[16px] font-semibold text-accent transition-colors active:bg-surface-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                  <IconPlus className="h-4 w-4" />
                </span>
                Add exercise
              </button>
            </div>
            <p className="px-4 text-[13px] text-dim">Swipe an exercise left to remove it.</p>
          </>
        )}
      </section>

      {error ? <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[14px] text-danger">{error}</p> : null}

      <div className="sticky bottom-[max(7.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-30 pb-2 md:bottom-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-2xl bg-accent py-4 text-center text-[16px] font-semibold text-black shadow-[0_12px_30px_-10px_rgba(252,118,5,0.55)] transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60"
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

// One exercise in the list: its number, name and muscle, then the two
// targets as editable pills (the same "Sets" / "Reps" pills the Train
// page shows).
function ExerciseRow({ row, index, onPatch }) {
  const e = row.exercise;
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold tabular-nums text-muted">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold text-fg">{e.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-dim">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: `var(--muscle-${muscleKey(e.muscle)})` }}
            />
            <span className="truncate">
              {e.muscle}
              {e.equipment ? ` · ${e.equipment}` : ""}
            </span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-full bg-surface-2 p-0.5">
          <StepButton
            label="One fewer set"
            disabled={row.sets <= 1}
            onClick={() => onPatch({ sets: Math.max(1, row.sets - 1) })}
          >
            &minus;
          </StepButton>
          <span className="min-w-[4rem] text-center text-[15px] font-semibold tabular-nums text-fg">
            {row.sets} {row.sets === 1 ? "set" : "sets"}
          </span>
          <StepButton
            label="One more set"
            disabled={row.sets >= 20}
            onClick={() => onPatch({ sets: Math.min(20, row.sets + 1) })}
          >
            +
          </StepButton>
        </div>
        <label className="flex items-center gap-2 rounded-full bg-surface-2 py-0.5 pl-3.5 pr-3 focus-within:ring-2 focus-within:ring-accent/60">
          <span className="text-[13px] text-dim">Reps</span>
          <input
            value={row.reps}
            onChange={(ev) => onPatch({ reps: ev.target.value })}
            placeholder="8 to 12"
            aria-label={`${e.name} reps target`}
            className="w-[5.25rem] bg-transparent py-1.5 text-[16px] font-semibold text-fg outline-none placeholder:font-normal placeholder:text-dim"
          />
        </label>
      </div>
    </div>
  );
}

function StepButton({ label, onClick, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] font-semibold text-fg transition-[background-color,transform] hover:bg-fg/10 active:scale-90 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function MenuButton({ onClick, disabled = false, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 text-left text-[15px] transition-colors hover:bg-fg/5 active:bg-fg/10 disabled:opacity-60 ${
        danger ? "text-danger" : "text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function IconPlus({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
