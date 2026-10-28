"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import Explain from "@/components/Explain";
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
    <div className="flex flex-col gap-2">
      {!trainedThisWeek ? (
        <p className="pb-1 text-[15px] text-muted">No sets logged yet this week.</p>
      ) : null}

      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-dim">Muscle</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-dim">This week</span>
      </div>

      <ul className="flex flex-col [&>*+*]:border-t [&>*+*]:border-border/70">
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

      <p className="flex items-center gap-1.5 pt-1 text-[13px] leading-snug text-muted">
        Shaded band: {target.low} to {target.high} hard sets, a typical range for growth.
        <Explain k="hardsets" />
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
    <span className={`tabular text-[11px] font-semibold ${up ? "text-good" : "text-dim"}`}>
      {up ? "+" : ""}
      {fmt(value)}
    </span>
  );
}

function ValueCell({ value, delta }) {
  return (
    <span className="flex w-[4.75rem] shrink-0 items-baseline justify-end gap-1">
      <span className="tabular text-[15px] font-semibold text-fg">{fmt(value)}</span>
      <Delta value={delta} />
    </span>
  );
}

function GroupRow({ group, target, muscleMax, groupMax, open, onToggle }) {
  const delta = group.lastWeek > 0 ? group.thisWeek - group.lastWeek : 0;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors active:bg-surface-2"
      >
        <span className="w-[5.5rem] shrink-0">
          <MusclePill muscle={group.parent} />
        </span>
        <span className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-fg/10">
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.min(100, (group.thisWeek / groupMax) * 100)}%`,
              backgroundColor: `var(--muscle-${muscleKey(group.parent)})`,
            }}
          />
        </span>
        <ValueCell value={group.thisWeek} delta={delta} />
        <IconChevron className={`h-3.5 w-3.5 shrink-0 text-dim transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open ? (
        <ul className="flex flex-col gap-2.5 pb-3.5 pr-[26px] pt-0.5">
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
    <li className="flex items-center gap-3">
      <span className="w-[5.5rem] shrink-0 truncate pl-2 text-[13px] leading-tight text-muted">
        {m.muscle.replace(/\s*\(.*\)$/, "")}
      </span>

      <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-fg/10">
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
