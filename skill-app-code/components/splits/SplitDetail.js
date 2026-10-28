"use client";

import { useState } from "react";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgramSetup from "@/components/splits/ProgramSetup";
import VideoModal from "@/components/log/VideoModal";
import WeekGrid from "@/components/splits/WeekGrid";
import { weekLayout, cleanFocus } from "@/lib/splitWeek";
import { sortVariants, muscleKey } from "@/lib/exercises";

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
    <div className="flex flex-col gap-8">
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
            <div className="flex flex-col gap-1 py-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{sel?.weekday}</span>
              <span className="font-display text-[1.6rem] font-bold leading-[1.1] tracking-[-0.02em] text-fg">Rest day</span>
              <p className="mt-1 text-[15px] text-muted">Nothing scheduled. Recover, walk, sleep well.</p>
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
  const anyVideo = list.some((i) => i.exercise.video_url);

  // One surface only: the exercise list is the single grouped container
  // (like an iOS inset list), everything else sits on the page itself.
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">{eyebrow}</span>
        ) : null}
        <h2 className="font-display text-[1.6rem] font-bold leading-[1.1] tracking-[-0.02em] text-fg">
          {day.template.name}
        </h2>
        {day.template.description ? (
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{day.template.description}</p>
        ) : null}
      </div>

      {variants.length > 1 ? (
        <div role="tablist" aria-label="Equipment" className="flex rounded-[10px] bg-surface-2 p-0.5">
          {variants.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === variant}
              onClick={() => setVariant(v)}
              className={`flex-1 rounded-[8px] px-2 py-1.5 text-[13px] font-semibold transition-[background-color,color] duration-150 ${
                v === variant ? "bg-fg text-bg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <ul className="overflow-hidden rounded-2xl bg-surface">
          {list.map((item, idx) => {
            const hasVideo = Boolean(item.exercise.video_url);
            const body = (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    hasVideo ? "bg-accent-soft text-accent" : "bg-surface-2 text-dim"
                  }`}
                >
                  {hasVideo ? <IconPlay className="ml-0.5 h-3.5 w-3.5" /> : <IconDot className="h-1.5 w-1.5" />}
                </span>
                <span
                  className={`flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 ${
                    idx > 0 ? "border-t border-border/70" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold text-fg">{item.exercise.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-dim">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(--muscle-${muscleKey(item.exercise.muscle)})` }}
                      />
                      <span className="truncate">
                        {item.exercise.muscle}
                        {item.exercise.equipment ? ` · ${item.exercise.equipment}` : ""}
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Stat label="Sets" value={item.sets} />
                      <Stat label="Reps" value={item.reps} />
                    </span>
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
                    aria-label={`${item.exercise.name}, watch the form video`}
                    className="flex w-full items-center gap-3 pl-4 text-left transition-colors active:bg-surface-2"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 pl-4">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        {anyVideo ? <p className="px-4 text-[13px] text-dim">Tap an exercise to watch the form video.</p> : null}
      </div>

      <div className="flex flex-col gap-1 pt-1">
        {canProgram ? (
          <button
            type="button"
            onClick={onStartProgram}
            className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color] duration-100 hover:bg-accent-2 active:scale-[0.98]"
          >
            Start the {programWeeks}-week program
          </button>
        ) : null}
        <GuardedStartLink
          href={`/log?split=${split.id}&day=${day.template.id}&variant=${encodeURIComponent(variant)}`}
          className={
            canProgram
              ? "flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-[16px] font-semibold text-accent transition-[transform,background-color] duration-100 hover:bg-accent-soft active:scale-[0.98]"
              : "flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color] duration-100 hover:bg-accent-2 active:scale-[0.98]"
          }
        >
          Just log this session
        </GuardedStartLink>
      </div>

      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
    </section>
  );
}

// A small sets/reps pill: the label quiet, the number in the body font
// (not the condensed stats face) so it reads like the rest of the row.
function Stat({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-sans text-[12px] leading-none">
      <span className="text-dim">{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </span>
  );
}

function IconDot(props) {
  return (
    <svg viewBox="0 0 8 8" fill="currentColor" {...props}>
      <circle cx="4" cy="4" r="4" />
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
