"use client";

// A tiny sessionStorage marker: "there is an unsaved workout on the Log
// screen somewhere in this tab." Used to warn before starting a
// different one and silently losing it. sessionStorage (not
// localStorage) on purpose: scoped to this tab, and gone once it closes,
// which matches what "in the middle of a workout" should mean.

const KEY = "skill:activeWorkout";

export function markWorkoutActive(info = {}) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...info, startedAt: Date.now() }));
  } catch {
    // Storage disabled; the guard just will not fire, no worse than
    // today.
  }
}

export function getActiveWorkout() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveWorkout() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
