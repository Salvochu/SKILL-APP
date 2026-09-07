"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgramSetup from "@/components/splits/ProgramSetup";
import VideoModal from "@/components/log/VideoModal";
import WeekGrid from "@/components/splits/WeekGrid";
import { sortVariants } from "@/lib/exercises";

// The body of a split's own page: an example week, the day breakdowns,
// and (for splits that have a guided program) a button that opens the
// program setup in a sheet. The page header (name, description, back
// link) lives in the route.
export default function SplitDetail({ split, template, activeProgram }) {
  const canProgram = Boolean(template);
  const [setupOpen, setSetupOpen] = useState(false);
  const isBenchmark = split.section === "benchmark";
  const oneDay = split.days.length === 1;

  return (
    <div className="flex flex-col gap-6">
      {split.days.length > 0 && !isBenchmark ? (
        <WeekGrid split={split} />
      ) : split.days.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">Your week</span>
          <div className="flex flex-wrap gap-2">
            {split.days.map((day, i) => (
              <span
                key={day.id}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1"
              >
                <span className="text-[10px] font-bold text-accent/70">{i + 1}</span>
                <span className="text-xs font-semibold text-fg">{shortDayName(day.template.name)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {canProgram ? (
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-field bg-accent px-4 py-4 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start the {template.weeks}-week program
          <IconArrow className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex flex-col gap-3">
        {split.days.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-dim">
              {oneDay ? "The session" : "The days"}
            </span>
            {canProgram ? (
              <p className="text-xs text-dim">
                Prefer to freestyle? Open a day and log it on its own, no program needed.
              </p>
            ) : null}
          </div>
        ) : null}
        {split.days.map((day, i) => (
          <DayCard key={day.id} day={day} split={split} index={i} single={oneDay} />
        ))}
      </div>

      {setupOpen && template ? (
        <ProgramSetup
          template={template}
          activeProgram={activeProgram}
          onCancel={() => setSetupOpen(false)}
        />
      ) : null}
    </div>
  );
}

function DayCard({ day, split, index, single }) {
  const variants = sortVariants(Object.keys(day.variants));
  const [variant, setVariant] = useState(variants[0]);
  const [open, setOpen] = useState(single);
  const [videoFor, setVideoFor] = useState(null);
  const list = day.variants[variant] ?? [];

  return (
    <section className="flex flex-col rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {single ? day.template.focus : day.label || `Day ${index + 1}`}
          </span>
          <span className="font-display text-lg font-semibold text-fg">{day.template.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-field border border-border px-2.5 py-1 text-xs font-semibold text-muted">
          {open ? "Hide" : "View"}
          <IconChevron className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        </span>
      </button>

      {open ? (
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

          <GuardedStartLink
            href={`/log?split=${split.id}&day=${day.template.id}&variant=${encodeURIComponent(variant)}`}
            className="self-end rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Start{variants.length > 1 ? ` (${variant})` : ""}
          </GuardedStartLink>
        </div>
      ) : null}

      {videoFor ? <VideoModal exercise={videoFor} onClose={() => setVideoFor(null)} /> : null}
    </section>
  );
}

function shortDayName(name) {
  const n = String(name || "").trim();
  const parts = n.split(/\s+/);
  if (parts.length === 2 && /^(day|body)$/i.test(parts[1])) return parts[0];
  return n;
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function IconArrow(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
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
