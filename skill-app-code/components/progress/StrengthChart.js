"use client";

import { useState } from "react";
import { compact, shortDate, niceStep } from "@/components/progress/chartkit";
import { useChartWidth } from "@/components/progress/useChartWidth";

const H = 190;
const M = { top: 22, right: 12, bottom: 24, left: 36 };

// Estimated 1RM (Epley) over time for one lift. Single series, so the
// selector names it and no legend is needed. Crosshair + tooltip on hover.
export default function StrengthChart({ exercises, unit = "kg" }) {
  const [wrapRef, W] = useChartWidth();
  const usable = exercises.filter((e) => e.points.length >= 2);
  const [id, setId] = useState(usable[0]?.id);
  const [hover, setHover] = useState(null);

  const ex = usable.find((e) => e.id === id) ?? usable[0];
  if (!ex) return null;

  const pts = ex.points;
  const values = pts.map((p) => p.best1rm);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  // Zoomed into the band the lift lives in, with four or five round
  // gridlines across it (same scale rules as Compare two lifts).
  const yMin = Math.max(0, Math.floor((lo * 0.9) / 5) * 5);
  const step = niceStep(hi * 1.1 - yMin);
  const yMax = Math.max(yMin + step, Math.ceil((hi * 1.06) / step) * step);
  const ticks = [];
  for (let t = yMin; t <= yMax + 1e-9; t += step) ticks.push(Math.round(t));
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i) => M.left + (pts.length === 1 ? plotW / 2 : (plotW * i) / (pts.length - 1));
  const y = (v) => M.top + plotH * (1 - (v - yMin) / (yMax - yMin || 1));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.best1rm)}`).join(" ");
  const last = pts.length - 1;
  const labelEvery = Math.max(1, Math.ceil(pts.length / Math.max(1, Math.floor(plotW / 56))));

  return (
    <figure className="flex flex-col gap-3">
      {usable.length > 1 ? (
        <span className="relative inline-flex w-fit items-center">
          <select
            value={ex.id}
            onChange={(e) => {
              setId(e.target.value);
              setHover(null);
            }}
            aria-label="Lift"
            className="cursor-pointer appearance-none rounded-full bg-fg/10 py-2 pl-4 pr-9 text-[15px] font-semibold text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {usable.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <IconUpDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted" />
        </span>
      ) : (
        <span className="text-[15px] font-semibold text-fg">{ex.name}</span>
      )}

      <div ref={wrapRef} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block" role="img" aria-label={`Estimated one rep max for ${ex.name} over time`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity="0.7" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[11px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {compact(t)}
              </text>
            </g>
          ))}

          {hover != null ? (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} stroke="var(--color-border-strong)" strokeWidth="1" />
          ) : null}

          <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {pts.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.best1rm)}
              r={hover === i ? 5.5 : 4}
              fill="var(--color-accent)"
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          ))}

          <text x={x(last)} y={y(pts[last].best1rm) - 11} textAnchor="end" className="fill-fg text-[12px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {compact(pts[last].best1rm)} {unit}
          </text>

          {pts.map((p, i) => (
            <rect
              key={i}
              x={x(i) - plotW / pts.length / 2}
              y={M.top}
              width={plotW / pts.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onPointerDown={() => setHover(i)}
            />
          ))}

          {pts.map((p, i) =>
            i === last || (i % labelEvery === 0 && x(last) - x(i) >= 52) ? (
              <text key={i} x={x(i)} y={H - 6} textAnchor={i === last ? "end" : i === 0 ? "start" : "middle"} className="fill-dim text-[11px]">
                {shortDate(p.date)}
              </text>
            ) : null,
          )}
        </svg>

        {hover != null ? (
          <div
            className="glass-strong pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 text-[13px] leading-tight"
            style={{
              left: `${Math.min(Math.max(x(hover), 80), W - 80)}px`,
              top: `${y(pts[hover].best1rm) - 10}px`,
            }}
          >
            <div className="font-semibold text-fg tabular-nums">~{compact(pts[hover].best1rm)} {unit} 1RM</div>
            <div className="whitespace-nowrap text-muted tabular-nums">
              {pts[hover].topWeight} {unit} x {pts[hover].topReps} · {shortDate(pts[hover].date)}
            </div>
          </div>
        ) : null}
      </div>
    </figure>
  );
}

function IconUpDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
    </svg>
  );
}
