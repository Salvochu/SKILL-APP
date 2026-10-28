"use client";

import { useRef, useState } from "react";
import { muscleKey } from "@/lib/exercises";
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
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3">
            <h2 className="font-display text-[1.35rem] font-bold tracking-[-0.02em] text-fg">Reorder exercises</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <ul
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            className="flex min-h-0 flex-1 touch-none flex-col overflow-y-auto px-4 py-2"
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
              // Rows sit edge to edge as one grouped list (hairlines, rounded
              // ends), so a row's measured height is exactly one step of the
              // drag. The lifted row floats as its own rounded card.
              const first = index === 0;
              const last = index === order.length - 1;
              return (
                <li
                  key={r.key}
                  data-row={r.key}
                  style={style}
                  className={`flex items-center gap-3 py-3 pl-4 pr-2 ${
                    dragging
                      ? "rounded-xl bg-surface-2 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.6)]"
                      : `bg-surface ${first ? "rounded-t-2xl" : "border-t border-border/70"} ${last ? "rounded-b-2xl" : ""}`
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold text-fg">{r.exercise.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-dim">
                      {primary ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(--muscle-${muscleKey(primary)})` }}
                        />
                      ) : null}
                      {primary}
                    </span>
                  </span>
                  {/* The grip sits on the right, where iOS puts it. */}
                  <button
                    type="button"
                    aria-label={`Drag ${r.exercise.name}`}
                    onPointerDown={(e) => pointerDown(e, r.key)}
                    className="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-dim active:cursor-grabbing active:bg-fg/10"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 9h14M5 15h14" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:pb-4">
            <button
              type="button"
              onClick={() => {
                onSave(order);
                close();
              }}
              className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
