"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_MS = 280;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.55; // px/ms

// Shared bottom-sheet shell: slides up from the bottom (mobile) or fades
// up into place (desktop, where the flex container centers it instead),
// and can be dragged down by its handle to dismiss, iOS-sheet style. The
// drag tracks the pointer 1:1 with no transition (so it feels directly
// attached to your finger); releasing past a distance or flick velocity
// finishes the dismiss, otherwise it springs back to rest.
//
// `onClose` is the real unmount - called only after the exit transition
// finishes, so parents don't need their own animation logic. `children`
// can be a node or a render function `(requestClose) => node` for any
// in-content close triggers (a header X button, a "Done" action, etc).
export default function Sheet({ onClose, ariaLabel, children, panelClassName = "", showHandle = true }) {
  // Whether to skip the transform/opacity choreography entirely. Read
  // once, lazily, during the first client render rather than in an
  // effect: Sheet is only ever mounted client-side (in response to a
  // user action), so there's no SSR markup for this to mismatch against.
  // Plain state (not a ref) on purpose: `requestClose` closes over it and
  // gets handed to `children` as a render-prop, and a function that reads
  // a ref's `.current` can't safely cross that boundary (it might run
  // during the child's own render instead of from an event handler).
  const [reduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const [stage, setStage] = useState(() => (reduced ? "entered" : "entering")); // entering | entered | closing
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0); // pointerdown Y, fixed for the drag - total offset is measured from this
  const lastMoveRef = useRef({ y: 0, t: 0 }); // most recent move, for flick velocity
  const velocityRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const raf = requestAnimationFrame(() => setStage("entered"));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  function requestClose() {
    if (reduced) {
      onClose();
      return;
    }
    setStage("closing");
    window.setTimeout(onClose, CLOSE_MS);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onHandlePointerDown(e) {
    setDragging(true);
    startYRef.current = e.clientY;
    lastMoveRef.current = { y: e.clientY, t: performance.now() };
    velocityRef.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onHandlePointerMove(e) {
    if (!dragging) return;
    const raw = e.clientY - startYRef.current;
    const y = raw < 0 ? raw * 0.3 : raw; // slight resistance dragging up past rest
    const now = performance.now();
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) velocityRef.current = (e.clientY - lastMoveRef.current.y) / dt;
    lastMoveRef.current = { y: e.clientY, t: now };
    setDragY(y);
  }
  function onHandlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    const shouldDismiss = dragY > DISMISS_DISTANCE || velocityRef.current > DISMISS_VELOCITY;
    if (shouldDismiss) {
      requestClose();
    } else {
      setDragY(0);
    }
  }

  const entered = stage === "entered";
  const panelStyle = {
    transform:
      dragging || dragY
        ? `translateY(${Math.max(dragY, 0)}px)`
        : entered
          ? "translateY(0)"
          : "translateY(100%)",
    transition: dragging ? "none" : `transform ${CLOSE_MS}ms ${EASE}`,
  };
  const backdropStyle = {
    opacity: entered && stage !== "closing" ? 1 : 0,
    transition: "opacity 240ms ease",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={backdropStyle}
      />
      <div
        className={`glass-strong relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] sm:rounded-3xl ${panelClassName}`}
        style={panelStyle}
      >
        {showHandle ? (
          <div
            className="flex shrink-0 touch-none items-center justify-center py-2 sm:hidden"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          >
            <span className="h-1.5 w-10 rounded-full bg-border-strong" />
          </div>
        ) : null}
        {typeof children === "function" ? children(requestClose) : children}
      </div>
    </div>
  );
}
