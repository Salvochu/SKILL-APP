"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// The 14-Day Challenge progress hero: a route that climbs from Day 1 to
// a finish flag. Completed days are solid nodes on a glowing trail; a
// spark runs the trail to where you are now. Pure inline SVG, no deps.
// Animation is gated by CSS @media (prefers-reduced-motion) in
// globals.css (.cc-* classes and the cc-draw keyframes); the two
// script-driven bits check matchMedia inside their effects.
//
// Props:
//   day          current challenge day (1..14+, clamped for display)
//   totalDays    14
//   completeDays number[]  days where the checklist is fully ticked
//   streak       consecutive complete days
const VB_W = 300;
const VB_H = 360;
const PATH_D = "M 40 330 Q 46 278 110 264 T 214 218 T 92 166 T 44 116 T 172 82 T 150 34";

export default function ChallengeClimb({ day = 1, totalDays = 14, completeDays = [], streak = 0 }) {
  const trackRef = useRef(null);
  const [geom, setGeom] = useState(null); // { points, length, upto, samples }

  const curDay = Math.min(Math.max(day, 1), totalDays);
  const doneSet = useMemo(() => new Set(completeDays), [completeDays]);
  const doneCount = completeDays.filter((d) => d >= 1 && d <= totalDays).length;

  useEffect(() => {
    const path = trackRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    const points = [];
    for (let i = 0; i < totalDays; i++) {
      const p = path.getPointAtLength((length * i) / (totalDays - 1));
      points.push({ x: p.x, y: p.y });
    }
    const upto = (length * (curDay - 1)) / (totalDays - 1);
    const samples = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const p = path.getPointAtLength((upto * i) / N);
      samples.push({ x: p.x, y: p.y });
    }
    setGeom({ points, length, upto, samples });
  }, [curDay, totalDays]);

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-gradient-to-b from-surface/60 to-bg">
      <div className="flex items-end justify-between gap-3 px-5 pt-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim">
            Main Character Challenge
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-[42px] font-bold leading-none text-fg">
              <CountUp to={curDay} />
            </span>
            <span className="font-display text-sm font-semibold uppercase tracking-widest text-dim">
              of {totalDays}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 pb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Flame className="h-3.5 w-3.5" />
            {streak} day{streak === 1 ? "" : "s"}
          </span>
          <span className="text-[11px] font-medium text-dim">
            {doneCount} of {totalDays} complete
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block w-full"
        role="img"
        aria-label={`Challenge progress: day ${curDay} of ${totalDays}, ${doneCount} days complete`}
      >
        <defs>
          <linearGradient id="cc-trail" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fc7605" />
            <stop offset="1" stopColor="#ffb454" />
          </linearGradient>
          <radialGradient id="cc-node" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffd9a8" />
            <stop offset="0.5" stopColor="#fc7605" />
            <stop offset="1" stopColor="#c85a02" />
          </radialGradient>
          <radialGradient id="cc-bloom-grad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fc7605" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fc7605" stopOpacity="0" />
          </radialGradient>
          <filter id="cc-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cc-hard" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {geom ? (
          <ellipse
            cx={geom.points[curDay - 1].x}
            cy={geom.points[curDay - 1].y}
            rx="90"
            ry="90"
            fill="url(#cc-bloom-grad)"
            className="cc-bloom"
          />
        ) : null}

        <path
          ref={trackRef}
          d={PATH_D}
          fill="none"
          stroke="#2b2016"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {geom ? (
          <>
            <path
              d={PATH_D}
              fill="none"
              stroke="url(#cc-trail)"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.35"
              filter="url(#cc-soft)"
              className="cc-trail-draw"
              style={{
                strokeDasharray: geom.length,
                strokeDashoffset: geom.length - geom.upto,
                ["--cc-len"]: geom.length,
                animationDelay: "260ms",
              }}
            />
            <path
              d={PATH_D}
              fill="none"
              stroke="url(#cc-trail)"
              strokeWidth="5"
              strokeLinecap="round"
              className="cc-trail-draw"
              style={{
                strokeDasharray: geom.length,
                strokeDashoffset: geom.length - geom.upto,
                ["--cc-len"]: geom.length,
                animationDelay: "200ms",
              }}
            />

            {geom.points.map((p, i) => {
              const n = i + 1;
              const done = doneSet.has(n);
              const current = n === curDay;
              const missed = n < curDay && !done;
              const finish = n === totalDays;
              return (
                <g
                  key={n}
                  className="cc-node"
                  style={{ animationDelay: `${180 + i * 70}ms`, transformOrigin: `${p.x}px ${p.y}px` }}
                >
                  {current ? (
                    <>
                      <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="#ffb454" strokeWidth="2" className="cc-halo" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
                      <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="#ffb454" strokeWidth="2" className="cc-halo cc-halo-2" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
                      <circle cx={p.x} cy={p.y} r="7.5" fill="url(#cc-node)" filter="url(#cc-soft)" />
                      <Pill x={p.x} y={p.y} w={VB_W} label={`DAY ${curDay}`} />
                    </>
                  ) : done ? (
                    <>
                      <circle cx={p.x} cy={p.y} r="7" fill="url(#cc-node)" filter="url(#cc-soft)" />
                      <path
                        d={`M ${p.x - 3.2} ${p.y + 0.2} l 2.3 2.4 l 4.4 -4.8`}
                        fill="none"
                        stroke="#1a1206"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : missed ? (
                    <circle cx={p.x} cy={p.y} r="5.5" fill="#140f0a" stroke="#4a382a" strokeWidth="2" strokeDasharray="1.5 3" />
                  ) : finish ? (
                    <g>
                      <line x1={p.x} y1={p.y + 5} x2={p.x} y2={p.y - 17} stroke="#6b5540" strokeWidth="1.6" strokeLinecap="round" />
                      <path d={`M ${p.x} ${p.y - 17} l 13 4 l -13 5 z`} fill="#4a382a" />
                      <circle cx={p.x} cy={p.y} r="4" fill="#140f0a" stroke="#4a382a" strokeWidth="1.5" />
                    </g>
                  ) : (
                    <circle cx={p.x} cy={p.y} r="4" fill="#100c08" stroke="#3a2c1e" strokeWidth="1.5" />
                  )}
                </g>
              );
            })}

            <Spark samples={geom.samples} />
          </>
        ) : null}
      </svg>
    </div>
  );
}

function Spark({ samples }) {
  const ref = useRef(null);
  const tail1 = useRef(null);
  const tail2 = useRef(null);
  useEffect(() => {
    if (!samples || samples.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const at = (frac) => {
      const f = Math.max(0, Math.min(1, frac));
      return samples[Math.round(f * (samples.length - 1))];
    };
    let raf;
    const start = performance.now();
    const dur = 1100;
    const place = (el, pt) => {
      if (!el || !pt) return;
      el.setAttribute("cx", pt.x);
      el.setAttribute("cy", pt.y);
    };
    const tick = (now) => {
      const t = Math.min(1, (now - start - 200) / dur);
      if (t < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const e = 1 - Math.pow(1 - t, 3);
      place(ref.current, at(e));
      place(tail1.current, at(e - 0.03));
      place(tail2.current, at(e - 0.06));
      if (t < 1) raf = requestAnimationFrame(tick);
      else [ref.current, tail1.current, tail2.current].forEach((el) => el && el.setAttribute("opacity", "0"));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [samples]);

  return (
    <g>
      <circle ref={tail2} r="2.5" fill="#ffcaa0" opacity="0.35" cx="-10" cy="-10" />
      <circle ref={tail1} r="3" fill="#ffd9b3" opacity="0.6" cx="-10" cy="-10" />
      <circle ref={ref} r="3.5" fill="#ffffff" filter="url(#cc-hard)" cx="-10" cy="-10" />
    </g>
  );
}

function Pill({ x, y, w, label }) {
  const left = x > w / 2;
  const px = left ? x - 58 : x + 13;
  return (
    <g>
      <rect x={px} y={y - 10} width="46" height="20" rx="10" fill="#ffb454" />
      <text
        x={px + 23}
        y={y + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        letterSpacing="0.06em"
        fill="#1a1206"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </text>
    </g>
  );
}

function CountUp({ to }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const start = performance.now();
    const dur = reduce ? 1 : 650 + to * 35;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      setN(Math.max(1, Math.round(t * to)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

function Flame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c1 3-1 5-2.5 6.5C8 10 7 11.5 7 14a5 5 0 0 0 10 0c0-2-1-3.5-2-5 .5 1.5 0 3-1 3.5.5-2-1-4-2-5.5C10 9 11 6 12 2z" />
    </svg>
  );
}
