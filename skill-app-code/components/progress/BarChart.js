"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { niceScale, compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 220;
const M = { top: 16, right: 14, bottom: 26, left: 44 };

// Volume-per-session bars. Single series, so no legend: the card title says
// what this is. Hover a bar for its exact value; a table view sits below.
export default function BarChart({ data, max = 16 }) {
  const router = useRouter();
  const [hover, setHover] = useState(null);
  const rows = data.slice(-max);
  const openWorkout = (id) => {
    if (id) router.push(`/workouts/${id}`);
  };

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

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
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
            const h = Math.max(0, baseline - top);
            const bx = x(i) - barW / 2;
            const r = Math.min(4, h);
            const active = hover === i;
            return (
              <g key={d.id}>
                <path
                  d={`M${bx},${baseline} L${bx},${top + r} Q${bx},${top} ${bx + r},${top} L${bx + barW - r},${top} Q${bx + barW},${top} ${bx + barW},${top + r} L${bx + barW},${baseline} Z`}
                  fill="var(--color-accent)"
                  opacity={hover == null || active ? 1 : 0.5}
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
                  className={d.id ? "cursor-pointer" : undefined}
                  role={d.id ? "button" : undefined}
                  tabIndex={d.id ? 0 : undefined}
                  aria-label={d.id ? `Open workout, ${compact(d.volumeKg)} kg on ${shortDate(d.date)}` : undefined}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => openWorkout(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openWorkout(d.id);
                    }
                  }}
                />
              </g>
            );
          })}

          {rows.map((d, i) =>
            i % Math.ceil(rows.length / 6) === 0 ? (
              <text key={d.id} x={x(i)} y={H - 8} textAnchor="middle" className="fill-dim text-[10px]">
                {shortDate(d.date)}
              </text>
            ) : null,
          )}
        </svg>

        {hover != null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-border bg-bg px-2 py-1 text-xs shadow-lg"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(rows[hover].volumeKg) / H) * 100}%` }}
          >
            <div className="font-medium text-fg">{compact(rows[hover].volumeKg)} kg</div>
            <div className="text-dim">{shortDate(rows[hover].date)}</div>
          </div>
        ) : null}
      </div>
    </figure>
  );
}
