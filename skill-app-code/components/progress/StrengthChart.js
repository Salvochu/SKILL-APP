"use client";

import { useState } from "react";
import { niceScale, compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 220;
const M = { top: 16, right: 16, bottom: 26, left: 44 };

// Estimated 1RM (Epley) over time for one lift. Single series, so the
// selector names it and no legend is needed. Crosshair + tooltip on hover.
export default function StrengthChart({ exercises, unit = "kg" }) {
  const usable = exercises.filter((e) => e.points.length >= 2);
  const [id, setId] = useState(usable[0]?.id);
  const [hover, setHover] = useState(null);

  const ex = usable.find((e) => e.id === id) ?? usable[0];
  if (!ex) return null;

  const pts = ex.points;
  const values = pts.map((p) => p.best1rm);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const { max: yMax, ticks } = niceScale(hi * 1.1);
  const yMin = Math.max(0, Math.floor((lo * 0.85) / 10) * 10);
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i) => M.left + (pts.length === 1 ? plotW / 2 : (plotW * i) / (pts.length - 1));
  const y = (v) => M.top + plotH * (1 - (v - yMin) / (yMax - yMin || 1));
  const geom = { yMin };
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.best1rm)}`).join(" ");
  const last = pts.length - 1;

  return (
    <figure className="flex flex-col gap-3">
      {usable.length > 1 ? (
        <select
          value={ex.id}
          onChange={(e) => { setId(e.target.value); setHover(null); }}
          className="w-fit rounded-field border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent"
        >
          {usable.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      ) : (
        <span className="text-sm font-medium text-fg">{ex.name}</span>
      )}

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Estimated one rep max for ${ex.name} over time`}>
          {ticks.filter((t) => t >= geom.yMin).map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {compact(t)}
              </text>
            </g>
          ))}

          <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {pts.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.best1rm)}
              r={hover === i ? 5 : 4}
              fill="var(--color-accent)"
              stroke="var(--color-bg)"
              strokeWidth="2"
            />
          ))}

          <text x={x(last)} y={y(pts[last].best1rm) - 10} textAnchor="end" className="fill-muted text-[10px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {compact(pts[last].best1rm)} {unit}
          </text>

          {pts.map((p, i) => (
            <rect
              key={i}
              x={x(i) - (W - M.left - M.right) / pts.length / 2}
              y={M.top}
              width={(W - M.left - M.right) / pts.length}
              height={H - M.top - M.bottom}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {hover != null ? (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} stroke="var(--color-border-strong)" strokeWidth="1" />
          ) : null}

          {pts.map((p, i) =>
            i % Math.ceil(pts.length / 6 || 1) === 0 || i === last ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-dim text-[10px]">
                {shortDate(p.date)}
              </text>
            ) : null,
          )}
        </svg>

        {hover != null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-border bg-bg px-2 py-1 text-xs shadow-lg"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(pts[hover].best1rm) / H) * 100}%` }}
          >
            <div className="font-medium text-fg">~{compact(pts[hover].best1rm)} {unit} 1RM</div>
            <div className="text-dim">
              {pts[hover].topWeight} {unit} x {pts[hover].topReps} . {shortDate(pts[hover].date)}
            </div>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
