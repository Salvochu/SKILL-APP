"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startMesocycle } from "@/app/(app)/dashboard/actions";
import { sortVariants } from "@/lib/exercises";
import VideoModal from "@/components/log/VideoModal";
import MusclePill from "@/components/MusclePill";
import StatPill from "@/components/ui/StatPill";

// A beginner's first month, offered as one clear choice. No week
// numbers, no RIR ramp, no deload - just "learn the lifts, add a little
// each session". `isChallengeGraduate` reframes the copy for someone
// converting from the free 14-day challenge, whose day templates this
// program actually reuses - "new to lifting, start here" would be an
// odd thing to tell someone who just finished 14 days of training.
export default function FoundationsCard({ split, isChallengeGraduate = false }) {
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
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <div className="relative flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          {isChallengeGraduate ? "Welcome back" : "New to lifting? Start here"}
        </span>
        <h2 className="font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">Foundations</h2>
        <p className="text-[15px] leading-relaxed text-muted">
          {isChallengeGraduate
            ? "The same Day A / Day B split from your 14-day challenge, now as an ongoing program. Keep adding a little weight whenever you hit your target reps."
            : "Two full-body days, three times a week for four weeks. Learn the main lifts and add a little weight whenever you hit your target reps. That is the whole plan."}
        </p>
      </div>

      {variants.length > 1 ? (
        <div className="relative flex flex-col gap-2">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Equipment</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                aria-pressed={v === variant}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                  v === variant ? "bg-fg text-bg" : "bg-fg/10 text-muted hover:text-fg"
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
        aria-expanded={showPlan}
        className="relative -my-1 flex items-center gap-1 self-start rounded-lg py-1 text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
      >
        {showPlan ? "Hide the plan" : "See the plan"}
        <IconChevron className={`h-4 w-4 transition-transform ${showPlan ? "rotate-90" : ""}`} />
      </button>

      {showPlan ? (
        <div className="relative flex flex-col gap-4">
          {days.map((day) => {
            const list = day.variants[variant] ?? day.variants[variants[0]] ?? [];
            return (
              <div key={day.id} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2 px-1">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">{day.template.name}</span>
                  <span className="truncate text-[13px] text-muted">{day.template.focus}</span>
                </div>
                <ul className="overflow-hidden rounded-2xl bg-fg/[0.05] [&>*+*]:border-t [&>*+*]:border-border/70">
                  {list.map((item) => {
                    const hasVideo = Boolean(item.exercise.video_url);
                    const body = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-fg">{item.exercise.name}</span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <MusclePill muscle={item.exercise.muscle} />
                            <StatPill label="Sets" value={item.sets} />
                            <StatPill label="Reps" value={item.reps} />
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <li key={`${item.variant}-${item.position}`}>
                        {hasVideo ? (
                          <button
                            type="button"
                            onClick={() => setVideoFor(item.exercise)}
                            className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-fg/5"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                              <IconPlay className="ml-0.5 h-3.5 w-3.5" />
                            </span>
                            {body}
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 px-3.5 py-3">
                            <span className="h-8 w-8 shrink-0" />
                            {body}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <p className="px-1 text-[13px] text-dim">Tap a lift to watch the form video.</p>
        </div>
      ) : null}

      {error ? <p className="relative text-[14px] text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={onStart}
        disabled={starting}
        className="relative flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60"
      >
        {starting ? "Starting..." : isChallengeGraduate ? "Continue with this split" : "Start Foundations"}
      </button>

      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
    </section>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
