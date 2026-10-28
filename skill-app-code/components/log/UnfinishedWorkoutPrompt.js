"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDraft, clearDraft } from "@/lib/activeWorkout";
import { formatElapsed } from "@/lib/training";

const THRESHOLD_MS = 90 * 60 * 1000;

// If a workout draft has been running (clock ticking) for 90+ minutes,
// prompt to finish or discard it the next time the app is opened or
// brought back to the foreground. Purely client-side: the draft lives in
// sessionStorage, so this only fires while the app is still alive, which
// is exactly when the timer is still counting. Controlled by the
// "unfinished workout" toggle on the Notifications screen (mirrored to
// localStorage as notif:unfinished).
export default function UnfinishedWorkoutPrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const [prompt, setPrompt] = useState(null); // { href, elapsedSec }
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function check() {
      let enabled = true;
      try {
        enabled = localStorage.getItem("notif:unfinished") !== "off";
      } catch {
        // default on
      }
      if (!enabled) return;
      const d = getDraft();
      if (!d || d.pausedAt) return;
      const elapsed = Date.now() - d.startedAt - (d.pausedTotalMs || 0);
      if (elapsed >= THRESHOLD_MS) {
        setPrompt({ href: d.href, elapsedSec: Math.round(elapsed / 1000) });
      }
    }
    check();
    function onVis() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!prompt || dismissed || pathname === "/log") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-label="Unfinished workout"
    >
      <button
        type="button"
        aria-label="Not now"
        onClick={() => setDismissed(true)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-2 rounded-3xl p-5">
        <h2 className="font-display text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-fg">Still training?</h2>
        <p className="text-[15px] leading-relaxed text-muted">
          Your workout has been running for{" "}
          <span className="clock font-semibold text-fg">{formatElapsed(prompt.elapsedSec)}</span>.
          Finish and save it, or discard it if you are done.
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => router.push(prompt.href)}
            className="rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
          >
            Finish workout
          </button>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setPrompt(null);
              router.refresh();
            }}
            className="rounded-2xl bg-fg/10 px-4 py-3.5 text-[16px] font-semibold text-danger transition-transform active:scale-[0.98]"
          >
            Discard it
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl px-4 py-2 text-[15px] font-medium text-muted transition-colors hover:text-fg"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
