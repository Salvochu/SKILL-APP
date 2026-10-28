"use client";

import { useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

// A typeable dial code field: shows "flag +code Country name" once a
// country is picked, and searches by name, code or dial digits while
// open. Unlike a native <select>, this also accepts whatever the user
// types as the dial code directly, in case their country is not in the
// list or they just want to type fast.
export default function DialCodeField({ value, onChange, bare = false, filled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.dial === value);
  // `bare` (inside a grouped row) shows just flag and code, no box.
  const displayValue = open
    ? query
    : selected
      ? bare
        ? `${selected.flag} ${selected.dial}`
        : `${selected.flag} ${selected.dial}  ${selected.name}`
      : value;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q,
    );
  }, [query]);

  function openList() {
    setQuery("");
    setOpen(true);
  }
  function pick(country) {
    onChange(country.dial);
    setOpen(false);
    setQuery("");
  }
  function onBlur() {
    // Give a click on a list item time to register before closing.
    setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) {
        // Nothing selected from the list: keep whatever was typed as a
        // raw dial code, as long as it looks like one.
        if (open && query.trim()) onChange(query.trim());
        setOpen(false);
      }
    }, 120);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        inputMode="tel"
        value={displayValue}
        onFocus={openList}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={onBlur}
        placeholder="Code"
        aria-label="Country code"
        className={
          bare
            ? "tabular-nums w-full min-w-0 bg-transparent py-3 text-right text-[16px] text-muted outline-none placeholder:text-dim focus:text-fg"
            : filled
              ? "tabular-nums w-full min-w-0 rounded-xl bg-fg/10 px-3 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
              : "tabular-nums w-full min-w-0 rounded-xl bg-fg/[0.07] px-3 py-2.5 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
        }
      />
      {open ? (
        <ul className={`glass-strong pop-in absolute ${bare ? "right-0 origin-top-right" : "origin-top-left"} z-20 mt-1.5 max-h-64 w-64 max-w-[80vw] overflow-y-auto rounded-2xl py-1.5`}>
          {results.length === 0 ? (
            <li className="px-4 py-2.5 text-[14px] text-muted">No match. The typed value will be used as is.</li>
          ) : (
            results.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[15px] text-fg hover:bg-fg/5 active:bg-fg/10"
                >
                  <span>{c.flag}</span>
                  <span className="tabular text-dim">{c.dial}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
