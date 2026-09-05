"use client";

// A tiny localStorage-backed queue for workouts that failed to save
// because there was no connection. The gym is the one place this app
// has to work with bad signal, and losing a just-logged session to a
// dropped connection is the single worst outcome, so this exists purely
// to make that recoverable instead of silent data loss.
//
// This is deliberately simple: no IndexedDB, no Background Sync API
// (iOS Safari does not implement Background Sync at all, so relying on
// it would silently not work for most of this app's users). Retrying on
// the browser's online event and on next load covers the real case,
// regaining signal while the app is still open or reopening it later.

const KEY = "skill:pendingWorkouts";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage disabled (private browsing, quota) - nothing we can do;
    // the caller already has the payload in memory for this session.
  }
}

export function queueWorkout(payload) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    queuedAt: Date.now(),
  };
  writeAll([...readAll(), entry]);
  return entry.id;
}

export function listQueuedWorkouts() {
  return readAll();
}

export function removeQueuedWorkout(id) {
  writeAll(readAll().filter((e) => e.id !== id));
}

// Heuristic: was this failure "no connection", not a real validation or
// server error? Errs toward treating it as offline, since queuing a
// workout that turns out to have been a real error just means the retry
// fails again harmlessly later, while wrongly showing "error, try again"
// for a dropped connection means the typed sets get lost.
export function isLikelyNetworkError(err) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = String(err?.message || err || "");
  return /fetch|network|load failed|internet|offline/i.test(msg);
}
