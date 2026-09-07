"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startMesocycle } from "@/app/(app)/dashboard/actions";
import { sortVariants } from "@/lib/exercises";
import VideoModal from "@/components/log/VideoModal";
import MusclePill from "@/components/MusclePill";

// A beginner's first month, offered as one clear choice. No week
// numbers, no RIR ramp, no deload - just "learn the lifts, add a little
// each session".
export default function FoundationsCard({ split }) {
  const router = useRouter();
  const days = split.days ?? [];
  const variants = sortVariants(
    Object.keys(days[0]?.variants ?? { "Full Gym": [] }),
  );
  const [variant, setVariant] = useState(variants[0] ?? "Full Gym");
  const [showPlan, setShowPlan] = useState(false);
  const [videoFor, setVideoFor] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  async function onStart() {
    setStarting(true);
    setError(null);
    const result = await startMesocycle("foundations", variant, 3);
    setStarting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-accent/40 bg-accent-soft p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">New to lifting? Start here</span>
        <h2 className="font-display text-lg font-semibold text-fg">Foundations</h2>
        <p className="text-sm text-muted">
          Two full-body days, three times a week for four weeks. Learn the main lifts and add a little
          weight whenever you hit your target reps. That is the whole plan.
        </p>
      </div>

      {variants.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Equipment</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  v === variant ? "border-accent bg-accent text-black" : "border-border text-muted hover:text-fg"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowPlan((v) => !v)}
        className="self-start text-xs font-medium text-accent hover:underline"
      >
        {showPlan ? "Hide the plan" : "See the plan"}
      </button>

      {showPlan ? (
        <div className="flex flex-col gap-3">
          {days.map((day) => {
            const list = day.variants[variant] ?? day.variants[variants[0]] ?? [];
            return (
              <div key={day.id} className="flex flex-col gap-2 rounded-field border border-border bg-surface p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {day.template.name}
                  </span>
                  <span className="text-xs text-dim">{day.template.focus}</span>
                </div>
                <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
                  {list.map((item) => {
                    const hasVideo = Boolean(item.exercise.video_url);
                    return (
                      <li key={`${item.variant}-${item.position}`} className="flex items-center gap-3 bg-bg/40 px-3 py-2">
                        {hasVideo ? (
                          <button
                            type="button"
                            onClick={() => setVideoFor(item.exercise)}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                              <IconPlay className="h-3 w-3" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-fg">{item.exercise.name}</span>
                              <MusclePill muscle={item.exercise.muscle} />
                            </span>
                          </button>
                        ) : (
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-fg">{item.exercise.name}</span>
                            <MusclePill muscle={item.exercise.muscle} />
                          </span>
                        )}
                        <span className="tabular shrink-0 text-xs text-muted">
                          {item.sets} x {item.reps}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <p className="text-xs text-dim">Tap a lift to watch the form video.</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={onStart}
        disabled={starting}
        className="w-full rounded-field bg-accent py-3 text-center font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {starting ? "Starting..." : "Start Foundations"}
      </button>

      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
    </section>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
