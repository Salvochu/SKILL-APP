"use client";

// The Log screen's in-progress draft, kept in sessionStorage: enough to
// actually resume it (title, date, notes, every row and set, the timer
// state), not just a flag. Used for two things: warning before starting
// a different workout and silently losing this one (GuardedStartLink),
// and the floating bar that lets you jump back into it from anywhere
// (ActiveWorkoutBar). sessionStorage, not localStorage, on purpose:
// scoped to this tab, and gone once it closes, which matches what "in
// the middle of a workout" should mean.

const KEY = "skill:activeWorkout";

export function saveDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage disabled; resuming just will not work, no worse than
    // before this existed.
  }
}

export function getDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
