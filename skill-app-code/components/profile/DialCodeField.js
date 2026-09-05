"use client";

import { useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

// A typeable dial code field: shows "flag +code Country name" once a
// country is picked, and searches by name, code or dial digits while
// open. Unlike a native <select>, this also accepts whatever the user
// types as the dial code directly, in case their country is not in the
// list or they just want to type fast.
export default function DialCodeField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.dial === value);
  const displayValue = open ? query : selected ? `${selected.flag} ${selected.dial}  ${selected.name}` : value;

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
        className="tabular w-full min-w-0 rounded-field border border-border bg-bg px-2 py-2 text-sm text-fg focus:border-accent"
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-64 max-w-[80vw] overflow-y-auto rounded-field border border-border bg-surface py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-dim">No match. The typed value will be used as is.</li>
          ) : (
            results.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-fg hover:bg-surface-2"
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
