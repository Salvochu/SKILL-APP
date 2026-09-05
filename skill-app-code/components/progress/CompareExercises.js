"use client";

import { useMemo, useState } from "react";
import { compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 240;
const M = { top: 18, right: 16, bottom: 26, left: 44 };
const SERIES = [
  { key: "a", color: "var(--color-accent)" },
  { key: "b", color: "var(--muscle-back)" },
];

// A round-ish gridline step, about four to five across the range.
function niceStep(range) {
  const target = Math.max(1, range) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  const n = target / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
}

// Two lifts on one "best set over time" chart, so you can see at a glance
// which is moving and which has stalled. Shared time axis; each line only
// has points on the days that lift was trained.
export default function CompareExercises({ exercises }) {
  const usable = useMemo(() => exercises.filter((e) => e.points.length >= 2), [exercises]);
  const [aId, setAId] = useState(usable[0]?.id);
  const [bId, setBId] = useState(usable[1]?.id ?? usable[0]?.id);
  const [hover, setHover] = useState(null);

  const a = usable.find((e) => e.id === aId) ?? usable[0];
  const b = usable.find((e) => e.id === bId) ?? usable[1] ?? usable[0];
  if (!a || !b) return null;

  const dates = [...new Set([...a.points, ...b.points].map((p) => p.date))].sort();
  const xi = new Map(dates.map((d, i) => [d, i]));

  const all = [...a.points, ...b.points].map((p) => p.best1rm);
  const rawHi = Math.max(...all);
  const rawLo = Math.min(...all);
  // Anchor at 0 when the two lifts are far apart (the size of the gap is
  // the point); otherwise zoom into the band they live in.
  const yMin = rawLo < rawHi * 0.6 ? 0 : Math.max(0, Math.floor((rawLo * 0.9) / 5) * 5);
  const step = niceStep(rawHi * 1.1 - yMin);
  const yMax = Math.max(yMin + step, Math.ceil((rawHi * 1.06) / step) * step);
  const ticks = [];
  for (let t = yMin; t <= yMax + 1e-9; t += step) ticks.push(Math.round(t));

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i) => M.left + (dates.length === 1 ? plotW / 2 : (plotW * i) / (dates.length - 1));
  const y = (v) => M.top + plotH * (1 - (v - yMin) / (yMax - yMin || 1));

  const lines = { a, b };

  return (
    <figure className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Picker value={a.id} onChange={setAId} options={usable} dot={SERIES[0].color} />
        <Picker value={b.id} onChange={setBId} options={usable} dot={SERIES[1].color} />
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Best set over time for ${a.name} and ${b.name}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {compact(t)}
              </text>
            </g>
          ))}

          {SERIES.map(({ key, color }, si) => {
            const pts = [...lines[key].points].sort((p, q) => p.date.localeCompare(q.date));
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(xi.get(p.date))},${y(p.best1rm)}`).join(" ");
            const last = pts[pts.length - 1];
            return (
              <g key={key}>
                <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p) => (
                  <circle key={p.date} cx={x(xi.get(p.date))} cy={y(p.best1rm)} r="3.5" fill={color} stroke="var(--color-bg)" strokeWidth="2" />
                ))}
                <text
                  x={x(xi.get(last.date))}
                  y={y(last.best1rm) + (si === 0 ? -9 : 16)}
                  textAnchor="end"
                  className="text-[10px] font-semibold"
                  fill={color}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {compact(last.best1rm)} kg
                </text>
              </g>
            );
          })}

          {dates.map((d, i) => (
            <rect
              key={d}
              x={x(i) - plotW / dates.length / 2}
              y={M.top}
              width={plotW / dates.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {hover != null ? (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} stroke="var(--color-border-strong)" strokeWidth="1" />
          ) : null}

          {dates.map((d, i) =>
            i % Math.ceil(dates.length / 6 || 1) === 0 || i === dates.length - 1 ? (
              <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className="fill-dim text-[10px]">
                {shortDate(d)}
              </text>
            ) : null,
          )}
        </svg>

        {hover != null ? (
          <div
            className="pointer-events-none absolute rounded-field border border-border bg-bg px-2 py-1.5 text-xs shadow-lg"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              top: "6%",
              transform: `translateX(${hover > dates.length / 2 ? "-100%" : "0"})`,
            }}
          >
            <div className="mb-1 text-dim">{shortDate(dates[hover])}</div>
            {SERIES.map(({ key, color }) => {
              const p = lines[key].points.find((q) => q.date === dates[hover]);
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-fg">{p ? `${compact(p.best1rm)} kg` : "not trained"}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SERIES.map(({ key, color }) => (
          <span key={key} className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {lines[key].name}
          </span>
        ))}
      </div>
    </figure>
  );
}

function Picker({ value, onChange, options, dot }) {
  return (
    <label className="flex items-center gap-2 rounded-field border border-border bg-surface px-2.5 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-sm text-fg focus:outline-none"
      >
        {options.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
    </label>
  );
}
