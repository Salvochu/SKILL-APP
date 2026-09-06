"use client";

import { useRef, useState } from "react";
import { niceScale, compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 220;
const M = { top: 16, right: 14, bottom: 26, left: 44 };

// Volume-per-session bars. Single series, so no legend: the card title
// says what this is. Hover or press a bar for its exact value. A table
// view sits below for the full numbers.
export default function BarChart({ data, max = 16, unit = "kg" }) {
  const [active, setActive] = useState(null); // bar index or null
  const hideTimer = useRef(null);
  const rows = data.slice(-max);

  function show(i) {
    clearTimeout(hideTimer.current);
    setActive(i);
  }
  function hideSoon() {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(null), 1400);
  }

  const peak = Math.max(1, ...rows.map((d) => d.volumeKg));
  const { max: yMax, ticks } = niceScale(peak);
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const band = plotW / Math.max(rows.length, 1);
  const barW = Math.min(24, band * 0.68);
  const x = (i) => M.left + band * i + band / 2;
  const y = (v) => M.top + plotH * (1 - v / yMax);
  const baseline = M.top + plotH;
  const tallest = rows.reduce((m, d, i) => (d.volumeKg > rows[m].volumeKg ? i : m), 0);

  const shown = active != null ? rows[active] : null;

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative select-none">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Training volume per session">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-dim text-[10px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {compact(t)}
              </text>
            </g>
          ))}

          {rows.map((d, i) => {
            const top = y(d.volumeKg);
            const bx = x(i) - barW / 2;
            const r = Math.min(4, Math.max(0, baseline - top));
            const dim = active != null && active !== i;
            return (
              <g key={d.id ?? i}>
                <path
                  d={`M${bx},${baseline} L${bx},${top + r} Q${bx},${top} ${bx + r},${top} L${bx + barW - r},${top} Q${bx + barW},${top} ${bx + barW},${top + r} L${bx + barW},${baseline} Z`}
                  fill="var(--color-accent)"
                  opacity={dim ? 0.5 : 1}
                />
                {i === tallest && d.volumeKg > 0 ? (
                  <text x={x(i)} y={top - 6} textAnchor="middle" className="fill-muted text-[10px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {compact(d.volumeKg)}
                  </text>
                ) : null}
                <rect
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  style={{ outline: "none" }}
                  onMouseEnter={() => show(i)}
                  onMouseLeave={hideSoon}
                  onPointerDown={() => show(i)}
                  onPointerUp={hideSoon}
                  onPointerCancel={hideSoon}
                />
              </g>
            );
          })}

          {rows.map((d, i) =>
            i % Math.ceil(rows.length / 6) === 0 ? (
              <text key={d.id ?? i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-dim text-[10px]">
                {shortDate(d.date)}
              </text>
            ) : null,
          )}
        </svg>

        {shown ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-border bg-bg px-2 py-1.5 text-xs shadow-lg"
            style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(shown.volumeKg) / H) * 100}%` }}
          >
            <div className="font-medium text-fg">{compact(shown.volumeKg)} {unit}</div>
            <div className="text-dim">{shortDate(shown.date)}</div>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
