"use client";

import { useState } from "react";
import { buildChallengeShareBlob } from "@/lib/challengeShare";

// Shown on the Challenge tab once the 14-day plan is finished: the badge,
// the numbers, and a share button that renders the PNG.
export default function ChallengeComplete({
  sessions = 0,
  targetSessions = 6,
  perfectDays = 0,
  volumeLabel = "0",
  topMuscles = [],
}) {
  const [status, setStatus] = useState("idle"); // idle | preparing | shared | downloaded

  async function onShare() {
    setStatus("preparing");
    let blob = null;
    try {
      blob = await buildChallengeShareBlob({
        sessions,
        targetSessions,
        perfectDays,
        volumeLabel,
        topMuscles,
      });
    } catch {
      /* fall through to text share */
    }
    const caption = `14 days done. ${sessions} sessions, ${perfectDays}/14 perfect days with SKILL. @salvador_skfitness`;
    const file = blob ? new File([blob], "skill-challenge.png", { type: "image/png" }) : null;

    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        setStatus("shared");
        return;
      } catch {
        setStatus("idle");
        return;
      }
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skill-challenge.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("downloaded");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: caption });
      } catch {
        /* cancelled */
      }
    }
    setStatus("idle");
  }

  return (
    <section className="overflow-hidden rounded-card border border-accent/40 bg-gradient-to-b from-accent-soft to-transparent">
      <div className="flex flex-col items-center gap-1 px-5 pt-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_30px_-4px_rgba(252,118,5,0.7)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-fg">
          Challenge complete
        </h2>
        <p className="text-sm text-muted">
          14 days done. That is more than most people manage. Here is what you put in.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 px-5">
        <Stat value={`${sessions}/${targetSessions}`} label="Sessions" />
        <Stat value={`${perfectDays}/14`} label="Perfect days" />
        <Stat value={volumeLabel} label="Volume" />
      </div>

      {topMuscles.length ? (
        <p className="mt-4 px-5 text-center text-xs font-semibold uppercase tracking-wider text-dim">
          Most trained: {topMuscles.slice(0, 3).map((m) => m.group ?? m).join(" · ")}
        </p>
      ) : null}

      <div className="p-5 pt-4">
        <button
          type="button"
          onClick={onShare}
          disabled={status === "preparing"}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
        >
          {status === "preparing"
            ? "Preparing..."
            : status === "shared"
              ? "Shared"
              : status === "downloaded"
                ? "Saved to your photos"
                : "Share your result"}
        </button>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center rounded-field border border-border bg-surface/60 px-2 py-3 text-center">
      <span className="font-display text-lg font-bold text-fg tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</span>
    </div>
  );
}
