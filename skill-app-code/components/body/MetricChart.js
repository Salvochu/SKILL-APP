"use client";

import { useState } from "react";
import { compact, shortDate } from "@/components/progress/chartkit";
import { useChartWidth } from "@/components/progress/useChartWidth";

const H = 170;
const M = { top: 22, right: 12, bottom: 24, left: 36 };

function niceStep(range) {
  const target = Math.max(0.5, range) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  const n = target / mag;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
}

// One metric over time (bodyweight, a tape measurement). Zoomed into the
// range the values actually sit in, since small changes are the story.
// Drawn at the card's real width, like the Progress charts.
export default function MetricChart({ points, unit = "" }) {
  const [wrapRef, W] = useChartWidth();
  const [hover, setHover] = useState(null);
  const pts = points.filter((p) => p.value != null);
  if (pts.length < 2) {
    return <p className="py-6 text-center text-[14px] text-muted">Log this at least twice to see a trend.</p>;
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
  const labelEvery = Math.max(1, Math.ceil(pts.length / Math.max(1, Math.floor(plotW / 56))));
  // Half-step gridlines (a 0.5 kg scale) need the decimal, or two ticks
  // read the same.
  const tickLabel = (t) => (step < 1 ? t.toFixed(1) : compact(t));

  return (
    <figure ref={wrapRef} className="relative flex flex-col">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block" role="img" aria-label="Metric over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity="0.7" strokeWidth="1" />
            <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[11px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {tickLabel(t)}
            </text>
          </g>
        ))}

        {hover != null ? (
          <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={H - M.bottom} stroke="var(--color-border-strong)" strokeWidth="1" />
        ) : null}

        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.value)} r={hover === i ? 5.5 : 4} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />
        ))}
        <text x={x(last)} y={y(pts[last].value) - 11} textAnchor="end" className="fill-fg text-[12px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
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
            onPointerDown={() => setHover(i)}
          />
        ))}

        {pts.map((p, i) =>
          i === last || (i % labelEvery === 0 && x(last) - x(i) >= 52) ? (
            <text key={p.date} x={x(i)} y={H - 6} textAnchor={i === last ? "end" : i === 0 ? "start" : "middle"} className="fill-dim text-[11px]">
              {shortDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>

      {hover != null ? (
        <div
          className="glass-strong pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 text-[13px] leading-tight"
          style={{
            left: `${Math.min(Math.max(x(hover), 56), W - 56)}px`,
            top: `${y(pts[hover].value) - 10}px`,
          }}
        >
          <div className="font-semibold text-fg tabular-nums">{pts[hover].value}{unit}</div>
          <div className="text-muted">{shortDate(pts[hover].date)}</div>
        </div>
      ) : null}
    </figure>
  );
}
