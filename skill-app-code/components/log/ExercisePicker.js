"use client";

import { useEffect, useMemo, useState } from "react";

export default function ExercisePicker({ exercises, onPick, onClose }) {
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises;
    return list.slice(0, 60);
  }, [exercises, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Add exercise">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-surface sm:rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-fg">Add Exercise</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
          />
        </div>
        <ul className="flex flex-col gap-2 overflow-y-auto p-4">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e)}
                className="flex w-full items-center gap-3 rounded-card border border-border bg-bg/40 px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
              >
                <span className="flex-1">
                  <span className="block text-sm font-medium text-fg">{e.name}</span>
                  <span className="block text-xs text-dim">{e.equipment}</span>
                </span>
                <span className="rounded-full bg-pill px-2 py-0.5 text-[11px] font-semibold text-pill-fg">{e.muscle}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">No exercises match.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
