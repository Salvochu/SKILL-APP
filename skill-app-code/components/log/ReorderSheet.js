"use client";

import { useRef, useState } from "react";
import MusclePill from "@/components/MusclePill";
import Sheet from "@/components/Sheet";

// A slide-up sheet for dragging the workout's exercises into a new order.
// Touch-first: press the handle on a row and drag it up or down. The
// dragged row follows the pointer directly (no transition, so it feels
// attached to your finger); the rows it passes slide out of the way with
// a short spring-like transition. The underlying order only actually
// changes on release - while dragging, everything else is just a visual
// preview driven by `hoverIndex`.
export default function ReorderSheet({ rows, onSave, onClose }) {
  const [order, setOrder] = useState(rows);
  const [dragKey, setDragKey] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const dragRef = useRef({ y: 0, index: 0, rowHeight: 60 });

  function pointerDown(e, key) {
    e.preventDefault();
    const index = order.findIndex((r) => r.key === key);
    const rowEl = e.currentTarget.closest("[data-row]");
    const height = rowEl?.getBoundingClientRect().height || 60;
    dragRef.current = { y: e.clientY, index, rowHeight: height };
    setDragKey(key);
    setHoverIndex(index);
    setDragY(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(e) {
    if (dragKey == null) return;
    const delta = e.clientY - dragRef.current.y;
    setDragY(delta);
    const steps = Math.round(delta / dragRef.current.rowHeight);
    const next = Math.max(0, Math.min(order.length - 1, dragRef.current.index + steps));
    setHoverIndex(next);
  }

  function pointerUp() {
    if (dragKey == null) return;
    const from = dragRef.current.index;
    const to = hoverIndex ?? from;
    if (to !== from) {
      setOrder((cur) => {
        const next = [...cur];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
    setDragKey(null);
    setHoverIndex(null);
    setDragY(0);
  }

  // How far (in row-heights) a non-dragged row at `index` should shift to
  // preview the drop, based on whether it sits between the drag's start
  // and current hover position.
  function shiftFor(index) {
    if (dragKey == null || hoverIndex == null) return 0;
    const { index: from } = dragRef.current;
    const to = hoverIndex;
    if (from === to) return 0;
    if (from < to) return index > from && index <= to ? -1 : 0;
    return index >= to && index < from ? 1 : 0;
  }

  return (
    <Sheet onClose={onClose} ariaLabel="Reorder exercises">
      {(close) => (
        <>
          <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-bold text-fg">Reorder exercises</h2>
            <button type="button" onClick={close} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <ul
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            className="flex min-h-0 flex-1 touch-none flex-col gap-2 overflow-y-auto p-4"
          >
            {order.map((r, index) => {
              const primary = r.exercise.muscles?.find((m) => m.role === "primary")?.name ?? r.exercise.muscle;
              const dragging = dragKey === r.key;
              const shift = shiftFor(index) * dragRef.current.rowHeight;
              const style = dragging
                ? { transform: `translateY(${dragY}px) scale(1.02)`, transition: "none", zIndex: 20, position: "relative" }
                : {
                    transform: shift ? `translateY(${shift}px)` : "translateY(0)",
                    transition: "transform 220ms cubic-bezier(0.22, 0.8, 0.2, 1)",
                    position: "relative",
                  };
              return (
                <li
                  key={r.key}
                  data-row={r.key}
                  style={style}
                  className={`flex items-center gap-3 rounded-card border px-2 py-2.5 ${
                    dragging ? "border-accent bg-surface-2 shadow-lg" : "border-border bg-bg/40"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Drag ${r.exercise.name}`}
                    onPointerDown={(e) => pointerDown(e, r.key)}
                    className="shrink-0 cursor-grab touch-none rounded p-1.5 text-dim active:cursor-grabbing"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 8h16M4 12h16M4 16h16" />
                    </svg>
                  </button>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{r.exercise.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <MusclePill muscle={primary} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            <button
              type="button"
              onClick={() => {
                onSave(order);
                close();
              }}
              className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
