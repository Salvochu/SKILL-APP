"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgramSetup from "@/components/splits/ProgramSetup";
import VideoModal from "@/components/log/VideoModal";
import WeekGrid from "@/components/splits/WeekGrid";
import { weekLayout, cleanFocus } from "@/lib/splitWeek";
import { sortVariants } from "@/lib/exercises";

// The body of a split's own page. For a multi-day split: the example
// week, and below it the session for whichever day is tapped. For a
// single-day split (or a benchmark): just that one session card. Each
// session card offers two ways to run it - start the guided program, or
// log this one session freely. The page header lives in the route.
export default function SplitDetail({ split, template, activeProgram, advanced = true }) {
  const isBenchmark = split.section === "benchmark";
  const days = [...(split.days ?? [])].sort((a, b) => a.position - b.position);
  const programWeeks = !isBenchmark && template ? template.weeks : null;
  const useGrid = !isBenchmark && days.length > 1;

  const slots = weekLayout(split);
  const [selected, setSelected] = useState(() => {
    const f = slots.findIndex((s) => s.day);
    return f >= 0 ? f : 0;
  });
  const [setupOpen, setSetupOpen] = useState(false);

  const sel = useGrid ? slots[selected] : null;

  return (
    <div className="flex flex-col gap-6">
      {useGrid ? (
        <>
          <WeekGrid split={split} selectedIndex={selected} onSelect={setSelected} />
          {sel?.day ? (
            <DaySession
              key={sel.day.id}
              day={sel.day}
              split={split}
              eyebrow={sel.weekday}
              programWeeks={programWeeks}
              onStartProgram={() => setSetupOpen(true)}
            />
          ) : (
            <div className="rounded-card border border-border bg-surface px-4 py-3.5 text-sm text-muted">
              {sel?.weekday}: rest day. Nothing scheduled.
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((day) => (
            <DaySession
              key={day.id}
              day={day}
              split={split}
              eyebrow={
                days.length === 1
                  ? cleanFocus(day.template.focus)
                  : day.label || day.template.name
              }
              programWeeks={programWeeks}
              onStartProgram={() => setSetupOpen(true)}
            />
          ))}
        </div>
      )}

      {setupOpen && template ? (
        <ProgramSetup
          template={template}
          activeProgram={activeProgram}
          advanced={advanced}
          onCancel={() => setSetupOpen(false)}
        />
      ) : null}
    </div>
  );
}

function DaySession({ day, split, eyebrow, programWeeks, onStartProgram }) {
  const variants = sortVariants(Object.keys(day.variants));
  const [variant, setVariant] = useState(variants[0]);
  const [videoFor, setVideoFor] = useState(null);
  const list = day.variants[variant] ?? [];
  const canProgram = Boolean(programWeeks);

  return (
    <section className="flex flex-col rounded-card border border-border bg-surface">
      <div className="flex flex-col gap-0.5 p-4">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</span>
        ) : null}
        <span className="font-display text-lg font-semibold text-fg">{day.template.name}</span>
      </div>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        {day.template.description ? (
          <p className="text-sm text-muted">{day.template.description}</p>
        ) : null}

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
                    v === variant
                      ? "border-accent bg-accent text-black"
                      : "border-border text-muted hover:text-fg"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
          {list.map((item) => {
            const hasVideo = Boolean(item.exercise.video_url);
            return (
              <li key={`${item.variant}-${item.position}`} className="flex items-center gap-3 bg-bg/40 px-3 py-2.5">
                {hasVideo ? (
                  <button
                    type="button"
                    onClick={() => setVideoFor(item.exercise)}
                    className="group flex flex-1 items-center gap-2.5 text-left"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-black">
                      <IconPlay className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-fg group-hover:text-accent">
                        {item.exercise.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <MusclePill muscle={item.exercise.muscle} />
                        <span className="text-xs text-dim">{item.exercise.equipment}</span>
                      </span>
                    </span>
                  </button>
                ) : (
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-fg">{item.exercise.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <MusclePill muscle={item.exercise.muscle} />
                      <span className="text-xs text-dim">{item.exercise.equipment}</span>
                    </span>
                  </span>
                )}
                <span className="tabular shrink-0 text-xs text-muted">
                  {item.sets} x {item.reps}
                </span>
              </li>
            );
          })}
        </ul>
        {list.some((i) => i.exercise.video_url) ? (
          <p className="text-xs text-dim">Tap a lift to watch the form video.</p>
        ) : null}

        <div className="flex flex-col gap-2 pt-1">
          {canProgram ? (
            <button
              type="button"
              onClick={onStartProgram}
              className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            >
              Start the {programWeeks}-week program
            </button>
          ) : null}
          <GuardedStartLink
            href={`/log?split=${split.id}&day=${day.template.id}&variant=${encodeURIComponent(variant)}`}
            className={
              canProgram
                ? "flex w-full items-center justify-center rounded-field border border-border px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
                : "flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            }
          >
            Just log this session
          </GuardedStartLink>
        </div>
      </div>

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
