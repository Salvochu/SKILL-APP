"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgramSetup from "@/components/splits/ProgramSetup";
import VideoModal from "@/components/log/VideoModal";
import WeekGrid from "@/components/splits/WeekGrid";
import { sortVariants } from "@/lib/exercises";

const SECTION_LABEL = { primary: "Choose your split", coached: "Coached programs" };

export default function SplitsBrowser({
  splits,
  strengthCheck = null,
  mesocycleTemplates = [],
  activeProgram = null,
  initialView = null,
}) {
  const [selectedId, setSelectedId] = useState(initialView);
  const all = strengthCheck ? [...splits, strengthCheck] : splits;
  const selected = all.find((s) => s.id === selectedId) ?? null;

  if (selected) {
    const template = mesocycleTemplates.find((t) => t.split?.id === selected.id) ?? null;
    return (
      <SplitDetail
        split={selected}
        template={template}
        activeProgram={activeProgram}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const sections = groupBySection(splits);
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Quick start</h2>
        <div className="flex flex-col gap-2.5">
          <GuardedStartLink
            href="/log"
            className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-accent-soft text-accent">
              <IconPlus className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-semibold text-fg">Log a workout</span>
              <span className="block text-sm text-muted">A free session, add any lifts you want</span>
            </span>
          </GuardedStartLink>

          {strengthCheck ? (
            <button
              type="button"
              onClick={() => setSelectedId("strength-check")}
              className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2 active:bg-accent-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-accent-soft text-accent">
                <IconGauge className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-base font-semibold text-fg">Strength Check</span>
                <span className="block text-sm text-muted">
                  Benchmark your main lifts, every 4 to 6 weeks
                </span>
              </span>
              <IconChevron className="h-4 w-4 shrink-0 text-dim" />
            </button>
          ) : null}
        </div>
      </section>

      {sections.map(({ section, items }) => (
        <section key={section} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
            {SECTION_LABEL[section] ?? section}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {items.map((split) => (
              <li key={split.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(split.id)}
                  className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2 active:bg-accent-soft"
                >
                  <SplitGlyph />
                  <span className="flex-1">
                    <span className="block font-display text-base font-semibold text-fg">
                      {split.name}
                    </span>
                    <span className="block text-sm text-muted">{split.cadence}</span>
                  </span>
                  <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SplitDetail({ split, template, activeProgram, onBack }) {
  const [mode, setMode] = useState(null); // null | "program" | "free"

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <IconChevron className="h-4 w-4 rotate-180" />
        Back
      </button>

      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg">{split.name}</h1>
        <p className="text-sm text-muted">{split.description}</p>
        <span className="mt-1 self-start rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-dim">
          {split.cadence}
        </span>
      </header>

      {split.days.length > 0 && split.section !== "benchmark" ? (
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

      <div className="grid gap-2 sm:grid-cols-2">
        {template ? (
          <button
            type="button"
            onClick={() => setMode(mode === "program" ? null : "program")}
            className={`flex flex-col gap-0.5 rounded-card border p-4 text-left transition-colors ${
              mode === "program"
                ? "border-accent bg-accent-soft"
                : "border-accent/40 bg-accent-soft/50 hover:bg-accent-soft"
            }`}
          >
            <span className="text-sm font-bold text-fg">Start a {template.weeks}-week program</span>
            <span className="text-xs text-muted">Guided, effort builds every week</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setMode(mode === "free" ? null : "free")}
          className={`flex flex-col gap-0.5 rounded-card border p-4 text-left transition-colors ${
            mode === "free" ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-2"
          }`}
        >
          <span className="text-sm font-bold text-fg">Log a single session</span>
          <span className="text-xs text-muted">View a day, then log it freely</span>
        </button>
      </div>

      {mode === "program" && template ? (
        <ProgramSetup template={template} activeProgram={activeProgram} onCancel={() => setMode(null)} />
      ) : null}

      {mode === "free" ? (
        <div className="flex flex-col gap-3">
          {split.days.map((day, i) => (
            <DayCard key={day.id} day={day} split={split} index={i} single={split.days.length === 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DayCard({ day, split, index, single }) {
  const variants = sortVariants(Object.keys(day.variants));
  const [variant, setVariant] = useState(variants[0]);
  const [open, setOpen] = useState(false);
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

function groupBySection(splits) {
  const order = ["primary", "coached"];
  const map = new Map();
  for (const s of splits) {
    if (!map.has(s.section)) map.set(s.section, []);
    map.get(s.section).push(s);
  }
  return [...map.keys()]
    .sort((a, b) => order.indexOf(a) + 99 - (order.indexOf(b) + 99))
    .map((section) => ({ section, items: map.get(section) }));
}

function SplitGlyph() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-accent-soft">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 9 5-9 5-9-5 9-5z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    </span>
  );
}
function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconGauge(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 14a2 2 0 0 0 2-2c0-1.5-2-5-2-5s-2 3.5-2 5a2 2 0 0 0 2 2z" />
      <path d="M4.2 17a9 9 0 1 1 15.6 0" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
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
