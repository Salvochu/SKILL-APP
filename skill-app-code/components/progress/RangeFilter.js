"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RANGE_PRESETS, DEFAULT_RANGE, MESO_TOKEN, parseRange } from "@/lib/dateRange";

// Time-period control for the Progress page. Writes ?range=<token> and
// lets the server recompute. Custom picks two dates and stores them as
// range=custom:YYYY-MM-DD:YYYY-MM-DD.
export default function RangeFilter({ mesoAvailable = false }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("range") || DEFAULT_RANGE;
  const resolved = parseRange(current);
  const isCustom = current.startsWith("custom:");
  const isMeso = current === MESO_TOKEN;

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
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
        {mesoAvailable ? (
          <Chip active={isMeso} onClick={() => setRange(MESO_TOKEN)}>
            This mesocycle
          </Chip>
        ) : null}
        {RANGE_PRESETS.map((p) => (
          <Chip
            key={p.token}
            active={!isCustom && !isMeso && current === p.token}
            onClick={() => setRange(p.token)}
          >
            {p.label}
          </Chip>
        ))}
        <Chip active={isCustom} onClick={() => setOpenCustom((v) => !v)}>
          {isCustom ? resolved.label : "Custom"}
        </Chip>
      </div>

      {openCustom ? (
        <div className="flex flex-wrap items-end gap-2.5 pt-1">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium text-muted">
            From
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl bg-fg/[0.06] px-3 py-2.5 text-[16px] text-fg outline-none focus:ring-2 focus:ring-accent/60"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium text-muted">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl bg-fg/[0.06] px-3 py-2.5 text-[16px] text-fg outline-none focus:ring-2 focus:ring-accent/60"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!from || !to}
            className="rounded-xl bg-accent px-4 py-2.5 text-[16px] font-semibold text-black transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40"
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
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
