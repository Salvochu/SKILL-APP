"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDraft } from "@/lib/activeWorkout";
import { formatElapsed } from "@/lib/training";

// Floating pill, everywhere except the Log screen itself, that shows the
// in-progress workout's live clock and jumps straight back into it.
// sessionStorage has no same-tab change event, so this just re-reads the
// draft on the same 1s tick it already needs for the clock.
export default function ActiveWorkoutBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  // Seeded null rather than Date.now(): Next.js flags reading the clock
  // during a component's initial render as unstable for prerendering.
  // The effect below sets a real value on the same tick it loads the
  // draft, and nothing renders until both are set anyway.
  const [now, setNow] = useState(null);

  useEffect(() => {
    function tick() {
      setDraft(getDraft());
      setNow(Date.now());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Hidden on /log (that's the active session itself) and on the workout
  // builder (/workouts/mine/*), whose own sticky Cancel/Save bar sits in
  // the same bottom-of-screen spot - the two would otherwise overlap.
  if (!draft || pathname === "/log" || pathname.startsWith("/workouts/mine/")) return null;

  const clockAt = draft.pausedAt ?? now;
  const elapsedSeconds = Math.max(0, Math.round((clockAt - draft.startedAt - (draft.pausedTotalMs || 0)) / 1000));

  return (
    <div className="fixed inset-x-4 z-40 bottom-[max(7.25rem,calc(env(safe-area-inset-bottom)+5.25rem))] md:inset-x-0 md:bottom-6">
      <button
        type="button"
        onClick={() => router.push(draft.href)}
        className="glass mx-auto flex w-full max-w-lg items-center gap-3 rounded-full px-4 py-3 text-left transition-transform active:scale-[0.98]"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${draft.pausedAt ? "bg-dim" : "animate-pulse bg-accent"}`}
          aria-hidden="true"
        />
        <span className="flex-1 truncate text-sm font-medium text-fg">{draft.title || "Workout in progress"}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">{formatElapsed(elapsedSeconds)}</span>
        <IconChevron className="h-4 w-4 shrink-0 text-dim" />
      </button>
    </div>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
