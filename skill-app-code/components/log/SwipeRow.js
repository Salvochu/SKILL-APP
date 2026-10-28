"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";

// A set row you swipe left to reveal Delete, the way iOS lists work.
//
// Motion follows Apple's fluid-interface rules: the row tracks the finger
// 1:1 (respecting where it was grabbed), resists past its edges instead of
// stopping dead, and on release a spring carries the finger's velocity
// into the settle, aiming at where the flick was heading rather than where
// the finger let go. Grabbing a row mid-animation picks it up from its
// live position.
//
// Taps still go straight to the inputs and buttons inside: a drag only
// starts once the finger has clearly moved sideways, and the click that
// ends a drag is swallowed so it can't tick a set by accident. The Delete
// button is a real button in the tab order; focusing it reveals the row.

const REVEAL = 88; // width of the Delete action, px
const SLOP = 8; // movement before we decide drag vs scroll, px

// Apple's designer-friendly spring (damping ratio + response) mapped to
// stiffness/damping for a unit mass.
function stepSpring(s, target, dt, dampingRatio, response) {
  const k = ((2 * Math.PI) / response) ** 2;
  const c = (4 * Math.PI * dampingRatio) / response;
  const a = -k * (s.x - target) - c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}
// Where a flick would come to rest (Apple's projection, scroll-like decay).
function project(velocity, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate);
}
// Progressive resistance past an edge.
function rubberband(overshoot, dimension = 140, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// `rounded` sets the corner radius of the row (and the action under it);
// pass "rounded-none" for rows inside a grouped list.
export default function SwipeRow({
  children,
  onDelete,
  deleteLabel = "Delete",
  actionLabel = "Delete",
  rounded = "rounded-xl",
  className = "",
}) {
  const rootRef = useRef(null);
  const fgRef = useRef(null);
  const actionRef = useRef(null);
  const st = useRef({ x: 0, v: 0, raf: 0, drag: null, open: false, swallowClick: false, resetAfterDelete: false, deleting: false });

  function paint(x) {
    if (fgRef.current) fgRef.current.style.transform = x ? `translate3d(${x}px,0,0)` : "";
    if (actionRef.current) actionRef.current.style.opacity = x < -0.5 ? "1" : "0";
  }

  function animateTo(target, { velocity = st.current.v, bounce = false, response = 0.38, onDone } = {}) {
    const s = st.current;
    cancelAnimationFrame(s.raf);
    s.v = velocity;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // A hidden page gets no animation frames, so settle instantly rather
    // than leave the row parked half way.
    if (reduce || document.hidden) {
      s.x = target;
      s.v = 0;
      paint(target);
      onDone?.();
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      stepSpring(s, target, dt, bounce ? 0.82 : 1, response);
      if (Math.abs(s.x - target) < 0.4 && Math.abs(s.v) < 6) {
        s.x = target;
        s.v = 0;
        paint(target);
        onDone?.();
        return;
      }
      paint(s.x);
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  }

  function setOpen(open, velocity = 0) {
    st.current.open = open;
    animateTo(open ? -REVEAL : 0, { velocity, bounce: Math.abs(velocity) > 400 });
  }

  // While open: a tap anywhere outside closes it.
  const onDocDown = useEffectEvent((e) => {
    if (st.current.open && rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
  });
  useEffect(() => {
    const state = st.current;
    const handler = (e) => onDocDown(e);
    document.addEventListener("pointerdown", handler, true);
    return () => {
      document.removeEventListener("pointerdown", handler, true);
      cancelAnimationFrame(state.raf);
    };
  }, []);

  // Sets are keyed by position, so after a delete this same row is reused
  // for the set that moves up into its place: snap it home once React
  // has committed the new content (not before, or the deleted set would
  // flash back).
  useLayoutEffect(() => {
    const s = st.current;
    if (s.resetAfterDelete) {
      s.resetAfterDelete = false;
      s.x = 0;
      s.v = 0;
      s.open = false;
      paint(0);
      if (fgRef.current) fgRef.current.style.opacity = "";
    }
  });

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = st.current;
    cancelAnimationFrame(s.raf); // interrupt: pick it up from where it is now
    s.drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      startX: s.x,
      axis: null,
      hist: [{ x: e.clientX, t: e.timeStamp }],
    };
  }

  function onPointerMove(e) {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.axis) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "y") {
        // A scroll, not a swipe: let the page have it, and settle back.
        s.drag = null;
        if (s.x !== (s.open ? -REVEAL : 0)) setOpen(s.open);
        return;
      }
      try {
        fgRef.current?.setPointerCapture?.(e.pointerId);
      } catch {
        /* pointer already gone: keep tracking without capture */
      }
      if (fgRef.current) fgRef.current.style.userSelect = "none";
      document.activeElement?.blur?.();
    }
    let x = d.startX + dx;
    if (x > 0) x = rubberband(x);
    else if (x < -REVEAL) x = -REVEAL + rubberband(x + REVEAL);
    s.x = x;
    paint(x);
    d.hist.push({ x: e.clientX, t: e.timeStamp });
    if (d.hist.length > 6) d.hist.shift();
  }

  function endDrag(e, cancelled) {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId) return;
    s.drag = null;
    if (fgRef.current) fgRef.current.style.userSelect = "";
    if (d.axis !== "x") {
      // A plain tap. If the row was open, the tap closes it.
      if (s.open && !cancelled) setOpen(false);
      return;
    }
    s.swallowClick = true;
    setTimeout(() => {
      st.current.swallowClick = false;
    }, 300);
    const first = d.hist[0];
    const lastSample = d.hist[d.hist.length - 1];
    const dt = lastSample.t - first.t;
    const velocity = !cancelled && dt > 0 ? ((lastSample.x - first.x) / dt) * 1000 : 0;
    const landing = s.x + project(velocity);
    setOpen(landing < -REVEAL / 2, velocity);
  }

  // Only the click that ends a drag lands on the row itself; the Delete
  // button sits outside it, so a quick tap on Delete always goes through.
  function onClickCapture(e) {
    if (st.current.swallowClick && fgRef.current?.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      st.current.swallowClick = false;
    }
  }

  function handleDelete() {
    const s = st.current;
    if (s.deleting) return;
    s.deleting = true;
    const width = fgRef.current?.offsetWidth ?? 320;
    const commit = () => {
      if (!s.deleting) return;
      s.deleting = false;
      if (fgRef.current) fgRef.current.style.opacity = "0";
      s.resetAfterDelete = true;
      onDelete();
    };
    animateTo(-width - 24, { velocity: Math.min(s.v, -800), response: 0.28, onDone: commit });
    // The delete never waits on the animation: if frames stall (app sent
    // to the background mid-swipe), it still goes through.
    setTimeout(commit, 450);
  }

  return (
    <div ref={rootRef} className={`relative isolate overflow-hidden ${rounded}`} onClickCapture={onClickCapture}>
      <div
        ref={fgRef}
        className={`relative z-10 touch-pan-y ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
      >
        {children}
      </div>
      {/* After the row in the DOM so it comes last in the tab order, but
          painted underneath it (z-0) until the row slides away. */}
      <div
        ref={actionRef}
        className="absolute inset-y-0 right-0 z-0 flex items-stretch justify-end rounded-[inherit] bg-danger opacity-0"
        style={{ width: REVEAL + 24 }}
      >
        <button
          type="button"
          onClick={handleDelete}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
          }}
          aria-label={deleteLabel}
          className="flex items-center justify-center text-[14px] font-semibold text-black"
          style={{ width: REVEAL }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
