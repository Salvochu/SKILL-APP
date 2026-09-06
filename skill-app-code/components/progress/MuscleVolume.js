"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import { muscleKey } from "@/lib/exercises";

// Hard sets per muscle this week against a reference band. The RP-style
// read: is each muscle getting enough stimulus this week, and how does
// it compare to last week. Two levels: the 6 parent groups are shown
// collapsed; tap one to see its muscles.
export default function MuscleVolume({ data }) {
  const { groups, target, trainedThisWeek } = data;

  const muscleMax = Math.max(
    target.high + 4,
    ...groups.flatMap((g) => g.muscles.map((m) => m.thisWeek)),
  );
  const groupMax = Math.max(1, ...groups.map((g) => g.thisWeek));

  const [open, setOpen] = useState({});

  return (
    <div className="flex flex-col gap-3">
      {!trainedThisWeek ? (
        <p className="text-sm text-muted">No sets logged yet this week.</p>
      ) : null}

      <div className="flex items-baseline justify-between pl-3 pr-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">Muscle</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-dim">This week</span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {groups.map((g) => (
          <GroupRow
            key={g.parent}
            group={g}
            target={target}
            muscleMax={muscleMax}
            groupMax={groupMax}
            open={!!open[g.parent]}
            onToggle={() => setOpen((s) => ({ ...s, [g.parent]: !s[g.parent] }))}
          />
        ))}
      </ul>

      <p className="text-xs text-dim">
        The shaded band is {target.low} to {target.high} hard sets per muscle, a common weekly range
        for growth. A set counts once for each main muscle and a half for each assisting muscle.
      </p>
    </div>
  );
}

function fmt(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function Delta({ value }) {
  if (!value) return null;
  const up = value > 0;
  return (
    <span className={`tabular text-[10px] ${up ? "text-good" : "text-dim"}`}>
      {up ? "+" : ""}
      {fmt(value)}
    </span>
  );
}

function ValueCell({ value, delta }) {
  return (
    <span className="flex w-[4.75rem] shrink-0 items-baseline justify-end gap-1">
      <span className="tabular text-sm font-semibold text-fg">{fmt(value)}</span>
      <Delta value={delta} />
    </span>
  );
}

function GroupRow({ group, target, muscleMax, groupMax, open, onToggle }) {
  const delta = group.lastWeek > 0 ? group.thisWeek - group.lastWeek : 0;

  return (
    <li className="rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <IconChevron className={`h-3.5 w-3.5 shrink-0 text-dim transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="w-20 shrink-0">
          <MusclePill muscle={group.parent} />
        </span>
        <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.min(100, (group.thisWeek / groupMax) * 100)}%`,
              backgroundColor: `var(--muscle-${muscleKey(group.parent)})`,
            }}
          />
        </span>
        <ValueCell value={group.thisWeek} delta={delta} />
      </button>

      {open ? (
        <ul className="flex flex-col gap-2 border-t border-border px-3 py-2.5">
          {group.muscles.map((m) => (
            <MuscleRow key={m.id} m={m} target={target} scaleMax={muscleMax} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function MuscleRow({ m, target, scaleMax }) {
  const pct = (v) => Math.min(100, (v / scaleMax) * 100);
  const bandLeft = pct(target.low);
  const bandWidth = pct(target.high) - bandLeft;
  const delta = m.lastWeek > 0 ? m.thisWeek - m.lastWeek : 0;
  const low = m.thisWeek > 0 && m.thisWeek < target.low;

  return (
    <li className="flex items-center gap-2.5">
      <span className="w-20 shrink-0 text-xs leading-tight text-muted">
        {m.muscle.replace(/\s*\(.*\)$/, "")}
      </span>

      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2">
        <span
          className="absolute inset-y-0 bg-fg/10"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${low ? "bg-muted" : "bg-accent"}`}
          style={{ width: `${pct(m.thisWeek)}%` }}
        />
      </div>

      <ValueCell value={m.thisWeek} delta={delta} />
    </li>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
