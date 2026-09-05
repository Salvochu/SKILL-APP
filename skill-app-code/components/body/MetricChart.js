"use client";

import { useState } from "react";
import { compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 200;
const M = { top: 16, right: 16, bottom: 24, left: 40 };

function niceStep(range) {
  const target = Math.max(0.5, range) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  const n = target / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
}

// One metric over time (bodyweight, a tape measurement). Zoomed into the
// range the values actually sit in, since small changes are the story.
export default function MetricChart({ points, unit = "" }) {
  const [hover, setHover] = useState(null);
  const pts = points.filter((p) => p.value != null);
  if (pts.length < 2) {
    return <p className="py-6 text-center text-sm text-dim">Log this at least twice to see a trend.</p>;
  }

  const values = pts.map((p) => p.value);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const pad = Math.max((hi - lo) * 0.2, 0.5);
  const step = niceStep(hi - lo + pad * 2);
  const yMin = Math.floor((lo - pad) / step) * step;
  const yMax = Math.ceil((hi + pad) / step) * step;
  const ticks = [];
  for (let t = yMin; t <= yMax + 1e-9; t += step) ticks.push(Math.round(t * 10) / 10);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i) => M.left + (pts.length === 1 ? plotW / 2 : (plotW * i) / (pts.length - 1));
  const y = (v) => M.top + plotH * (1 - (v - yMin) / (yMax - yMin || 1));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const last = pts.length - 1;

  return (
    <figure className="relative flex flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Metric over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {compact(t)}
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.value)} r={hover === i ? 4.5 : 3.5} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth="2" />
        ))}
        <text x={x(last)} y={y(pts[last].value) - 9} textAnchor="end" className="fill-muted text-[10px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {pts[last].value}
          {unit}
        </text>

        {pts.map((p, i) => (
          <rect
            key={p.date}
            x={x(i) - plotW / pts.length / 2}
            y={M.top}
            width={plotW / pts.length}
            height={plotH}
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
            <text key={p.date} x={x(i)} y={H - 6} textAnchor="middle" className="fill-dim text-[10px]">
              {shortDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>

      {hover != null ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-border bg-bg px-2 py-1 text-xs shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(pts[hover].value) / H) * 100}%` }}
        >
          <div className="font-medium text-fg">{pts[hover].value}{unit}</div>
          <div className="text-dim">{shortDate(pts[hover].date)}</div>
        </div>
      ) : null}
    </figure>
  );
}
