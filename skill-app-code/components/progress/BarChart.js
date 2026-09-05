"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { niceScale, compact, shortDate } from "@/components/progress/chartkit";

const W = 640;
const H = 220;
const M = { top: 16, right: 14, bottom: 26, left: 44 };
const HOLD_MS = 450;

// Volume-per-session bars. Single series, so no legend: the card title says
// what this is. Tap or hover a bar for its exact value; press and hold to
// get a button through to that workout. A table view sits below.
export default function BarChart({ data, max = 16 }) {
  const router = useRouter();
  // { i, mode } where mode is "peek" (value only) or "menu" (value + a
  // button to open the workout). null when nothing is shown.
  const [active, setActive] = useState(null);
  const holdTimer = useRef(null);
  const rows = data.slice(-max);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function startHold(i) {
    clearTimeout(holdTimer.current);
    setActive({ i, mode: "peek" });
    if (rows[i]?.id) {
      holdTimer.current = setTimeout(() => setActive({ i, mode: "menu" }), HOLD_MS);
    }
  }
  function cancelHold() {
    clearTimeout(holdTimer.current);
  }
  function dismiss() {
    clearTimeout(holdTimer.current);
    setActive(null);
  }
  function openWorkout(id) {
    if (id) router.push(`/workouts/${id}`);
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

  const shown = active ? rows[active.i] : null;

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
            const h = Math.max(0, baseline - top);
            const bx = x(i) - barW / 2;
            const r = Math.min(4, h);
            const isActiveBar = active?.i === i;
            return (
              <g key={d.id}>
                <path
                  d={`M${bx},${baseline} L${bx},${top + r} Q${bx},${top} ${bx + r},${top} L${bx + barW - r},${top} Q${bx + barW},${top} ${bx + barW},${top + r} L${bx + barW},${baseline} Z`}
                  fill="var(--color-accent)"
                  opacity={active == null || isActiveBar ? 1 : 0.5}
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
                  aria-label={d.id ? `${compact(d.volumeKg)} kg on ${shortDate(d.date)}, open workout` : undefined}
                  onPointerDown={() => startHold(i)}
                  onPointerUp={cancelHold}
                  onPointerCancel={cancelHold}
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive((a) => (a?.mode === "menu" ? a : { i, mode: "peek" }))}
                  onMouseLeave={() => {
                    cancelHold();
                    setActive((a) => (a && a.mode === "peek" && a.i === i ? null : a));
                  }}
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

        {active?.mode === "menu" ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute inset-0 cursor-default"
          />
        ) : null}

        {shown ? (
          <div
            className={`absolute -translate-x-1/2 -translate-y-full rounded-field border border-border bg-bg px-2 py-1.5 text-xs shadow-lg ${
              active.mode === "menu" ? "flex flex-col gap-1.5" : "pointer-events-none"
            }`}
            style={{ left: `${(x(active.i) / W) * 100}%`, top: `${(y(shown.volumeKg) / H) * 100}%` }}
          >
            <div>
              <div className="font-medium text-fg">{compact(shown.volumeKg)} kg</div>
              <div className="text-dim">{shortDate(shown.date)}</div>
            </div>
            {active.mode === "menu" && shown.id ? (
              <button
                type="button"
                onClick={() => {
                  openWorkout(shown.id);
                  dismiss();
                }}
                className="rounded-field bg-accent px-2 py-1 text-xs font-semibold text-black transition-colors hover:bg-accent-2"
              >
                View workout
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </figure>
  );
}
