"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import { sortVariants } from "@/lib/exercises";

const SECTION_LABEL = { primary: "Choose your split", coached: "Coached programs" };

export default function SplitsBrowser({ splits }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = splits.find((s) => s.id === selectedId) ?? null;

  if (selected) {
    return <SplitDetail split={selected} onBack={() => setSelectedId(null)} />;
  }

  const sections = groupBySection(splits);
  return (
    <div className="flex flex-col gap-8">
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
                  className="flex w-full items-center gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
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

function SplitDetail({ split, onBack }) {
  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <IconChevron className="h-4 w-4 rotate-90" />
        All splits
      </button>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">{split.name}</h1>
        <p className="text-sm text-muted">{split.description}</p>
      </header>

      <div className="flex flex-col gap-4">
        {split.days.map((day, i) => (
          <DayCard key={day.id} day={day} split={split} index={i} single={split.days.length === 1} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, split, index, single }) {
  const variants = sortVariants(Object.keys(day.variants));
  const [variant, setVariant] = useState(variants[0]);
  const list = day.variants[variant] ?? [];

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          {single ? day.template.focus : day.label || `Day ${index + 1}`}
        </span>
        <h3 className="font-display text-lg font-semibold text-fg">{day.template.name}</h3>
        {day.template.description ? (
          <p className="text-sm text-muted">{day.template.description}</p>
        ) : null}
      </div>

      {variants.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                v === variant
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted hover:text-fg"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {list.map((item) => (
          <li key={`${item.variant}-${item.position}`} className="flex items-center gap-3 bg-bg/40 px-3 py-2.5">
            <span className="flex-1">
              <span className="block text-sm font-medium text-fg">{item.exercise.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2">
                <MusclePill muscle={item.exercise.muscle} />
                <span className="text-xs text-dim">{item.exercise.equipment}</span>
              </span>
            </span>
            <span className="tabular shrink-0 text-xs text-muted">
              {item.sets} x {item.reps}
            </span>
          </li>
        ))}
      </ul>

      <GuardedStartLink
        href={`/log?split=${split.id}&day=${day.template.id}&variant=${encodeURIComponent(variant)}`}
        className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
      >
        Start {day.template.name}
        {variants.length > 1 ? ` (${variant})` : ""}
      </GuardedStartLink>
    </section>
  );
}

function groupBySection(splits) {
  const order = ["primary", "coached"];
  const map = new Map();
  for (const s of splits) {
    if (!map.has(s.section)) map.set(s.section, []);
    map.get(s.section).push(s);
  }
  return [...map.keys()]
    .sort((a, b) => (order.indexOf(a) + 99) - (order.indexOf(b) + 99))
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
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
