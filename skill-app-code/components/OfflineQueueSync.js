"use client";

import { useEffect, useState } from "react";
import { saveWorkout } from "@/app/(app)/log/actions";
import { listQueuedWorkouts, removeQueuedWorkout } from "@/lib/offlineQueue";

// Mounted once, app-wide. Retries any workouts that got saved locally
// because the connection dropped mid-save, whenever the browser comes
// back online or the app is reopened. Silent unless there is something
// to report, then a small pill shows briefly at the top of the screen.
export default function OfflineQueueSync() {
  const [pending, setPending] = useState(0);
  const [justSynced, setJustSynced] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function flush() {
      const items = listQueuedWorkouts();
      if (!cancelled) setPending(items.length);
      if (items.length === 0) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;

      let synced = 0;
      for (const item of items) {
        try {
          const result = await saveWorkout(item.payload);
          if (result?.error) continue; // rejected, not a connection issue; leave queued
          removeQueuedWorkout(item.id);
          synced += 1;
        } catch {
          break; // still no real connection; try again on the next online event
        }
      }
      if (cancelled) return;
      setPending(listQueuedWorkouts().length);
      if (synced > 0) setJustSynced(synced);
    }

    flush();
    window.addEventListener("online", flush);
    return () => {
      cancelled = true;
      window.removeEventListener("online", flush);
    };
  }, []);

  useEffect(() => {
    if (justSynced === 0) return;
    const t = setTimeout(() => setJustSynced(0), 5000);
    return () => clearTimeout(t);
  }, [justSynced]);

  if (justSynced > 0) {
    return (
      <Pill tone="accent">
        Synced {justSynced} workout{justSynced === 1 ? "" : "s"} saved offline.
      </Pill>
    );
  }
  if (pending > 0) {
    return (
      <Pill tone="muted">
        {pending} workout{pending === 1 ? "" : "s"} saved on this device, waiting to sync.
      </Pill>
    );
  }
  return null;
}

function Pill({ tone, children }) {
  return (
    <div
      className={`fixed inset-x-0 top-[calc(3.75rem+env(safe-area-inset-top))] z-50 mx-auto w-fit max-w-[90vw] rounded-full border px-3 py-1.5 text-center text-xs font-medium shadow-lg md:top-[calc(4.25rem+env(safe-area-inset-top))] ${
        tone === "accent" ? "border-accent/40 bg-accent-soft text-accent" : "border-border bg-surface text-muted"
      }`}
    >
      {children}
    </div>
  );
}
