"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RANGE_PRESETS, DEFAULT_RANGE, parseRange } from "@/lib/dateRange";

// Time-period control for the Progress page. Writes ?range=<token> and
// lets the server recompute. Custom picks two dates and stores them as
// range=custom:YYYY-MM-DD:YYYY-MM-DD.
export default function RangeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("range") || DEFAULT_RANGE;
  const resolved = parseRange(current);
  const isCustom = current.startsWith("custom:");

  const [openCustom, setOpenCustom] = useState(isCustom);
  const [from, setFrom] = useState(resolved.custom?.from ?? "");
  const [to, setTo] = useState(resolved.custom?.to ?? "");

  const today = new Date().toISOString().slice(0, 10);

  function setRange(token) {
    const next = new URLSearchParams(params);
    if (token === DEFAULT_RANGE) next.delete("range");
    else next.set("range", token);
    router.push(`/progress${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  function applyCustom() {
    if (!from || !to) return;
    setRange(`custom:${from}:${to}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {RANGE_PRESETS.map((p) => (
          <Chip key={p.token} active={!isCustom && current === p.token} onClick={() => setRange(p.token)}>
            {p.label}
          </Chip>
        ))}
        <Chip active={isCustom} onClick={() => setOpenCustom((v) => !v)}>
          {isCustom ? resolved.label : "Custom"}
        </Chip>
      </div>

      {openCustom ? (
        <div className="flex flex-wrap items-end gap-2 rounded-card border border-border bg-surface p-3">
          <label className="flex flex-col gap-1 text-xs text-dim">
            From
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-field border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-dim">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-field border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!from || !to}
            className="rounded-field bg-accent px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
