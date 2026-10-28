"use client";

import { useMemo, useState } from "react";
import { compact, shortDate, niceStep } from "@/components/progress/chartkit";
import { useChartWidth } from "@/components/progress/useChartWidth";

const H = 210;
const M = { top: 22, right: 12, bottom: 24, left: 36 };
const SERIES = [
  { key: "a", color: "var(--color-accent)" },
  { key: "b", color: "var(--muscle-back)" },
];

// Two lifts on one "best set over time" chart, so you can see at a glance
// which is moving and which has stalled. Shared time axis; each line only
// has points on the days that lift was trained.
export default function CompareExercises({ exercises, unit = "kg" }) {
  const [wrapRef, W] = useChartWidth();
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
  const labelEvery = Math.max(1, Math.ceil(dates.length / Math.max(1, Math.floor(plotW / 56))));

  return (
    <figure className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Picker value={a.id} onChange={setAId} options={usable} dot={SERIES[0].color} />
        <Picker value={b.id} onChange={setBId} options={usable} dot={SERIES[1].color} />
      </div>

      <div ref={wrapRef} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block" role="img" aria-label={`Best set over time for ${a.name} and ${b.name}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity="0.7" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[11px]" style={{ fontVariantNumeric: "tabular-nums" }}>
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
                <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p) => (
                  <circle key={p.date} cx={x(xi.get(p.date))} cy={y(p.best1rm)} r="4" fill={color} stroke="var(--color-surface)" strokeWidth="2" />
                ))}
                <text
                  x={x(xi.get(last.date))}
                  y={y(last.best1rm) + (si === 0 ? -10 : 18)}
                  textAnchor="end"
                  className="text-[12px] font-semibold"
                  fill={color}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {compact(last.best1rm)} {unit}
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
              onPointerDown={() => setHover(i)}
            />
          ))}
          {hover != null ? (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} stroke="var(--color-border-strong)" strokeWidth="1" />
          ) : null}

          {dates.map((d, i) =>
            i % labelEvery === 0 || i === dates.length - 1 ? (
              <text key={d} x={x(i)} y={H - 6} textAnchor={i === dates.length - 1 ? "end" : i === 0 ? "start" : "middle"} className="fill-dim text-[11px]">
                {shortDate(d)}
              </text>
            ) : null,
          )}
        </svg>

        {hover != null ? (
          <div
            className="glass-strong pointer-events-none absolute rounded-xl px-3 py-2 text-[13px] leading-snug"
            style={{
              left: `${x(hover)}px`,
              top: "6%",
              transform: `translateX(${hover > dates.length / 2 ? "calc(-100% - 8px)" : "8px"})`,
            }}
          >
            <div className="mb-1 text-muted">{shortDate(dates[hover])}</div>
            {SERIES.map(({ key, color }) => {
              const p = lines[key].points.find((q) => q.date === dates[hover]);
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="whitespace-nowrap font-semibold text-fg tabular-nums">{p ? `${compact(p.best1rm)} ${unit}` : "not trained"}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
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
    <label className="relative flex items-center gap-2.5 rounded-xl bg-fg/[0.06] pl-3.5 focus-within:ring-2 focus-within:ring-accent/60">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none bg-transparent py-2.5 pr-9 text-[16px] font-medium text-fg outline-none"
      >
        {options.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute right-3 h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    </label>
  );
}
