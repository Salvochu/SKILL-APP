"use client";

import { useEffect, useRef, useState } from "react";
import MusclePill from "@/components/MusclePill";

// A slide-up sheet for dragging the workout's exercises into a new order.
// Touch-first: press the handle on a row and drag it up or down; the list
// re-orders as you pass each row. "Done" writes the new order back.
export default function ReorderSheet({ rows, onSave, onClose }) {
  const [order, setOrder] = useState(rows);
  const [dragKey, setDragKey] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function pointerDown(e, key) {
    e.preventDefault();
    setDragKey(key);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(e) {
    if (dragKey == null || !listRef.current) return;
    const items = [...listRef.current.querySelectorAll("[data-row]")];
    const overEl = items.find((el) => {
      const r = el.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!overEl) return;
    const overKey = overEl.dataset.row;
    if (overKey === dragKey) return;
    setOrder((cur) => {
      const from = cur.findIndex((r) => r.key === dragKey);
      const to = cur.findIndex((r) => r.key === overKey);
      if (from < 0 || to < 0) return cur;
      const next = [...cur];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function pointerUp() {
    setDragKey(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Reorder exercises"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-surface sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-fg">Reorder exercises</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <ul
          ref={listRef}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          className="flex touch-none flex-col gap-2 overflow-y-auto p-4"
        >
          {order.map((r) => {
            const primary = r.exercise.muscles?.find((m) => m.role === "primary")?.name ?? r.exercise.muscle;
            const held = dragKey === r.key;
            return (
              <li
                key={r.key}
                data-row={r.key}
                className={`flex items-center gap-3 rounded-card border px-2 py-2.5 transition-shadow ${
                  held
                    ? "border-accent bg-surface-2 shadow-lg"
                    : "border-border bg-bg/40"
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

        <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <button
            type="button"
            onClick={() => onSave(order)}
            className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
