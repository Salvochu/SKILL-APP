"use client";

import { useEffect, useMemo, useState } from "react";
import { shortDate } from "@/components/progress/chartkit";
import { buildPhotoCompareBlob } from "@/lib/photoShare";

function photoFor(group, angle) {
  if (!group) return null;
  return group.items.find((p) => p.angle === angle) ?? group.items[0] ?? null;
}

export default function PhotoCompare({ dates, bodyByDate, unit, onClose }) {
  // dates come newest-first; default before = oldest, after = newest.
  const [beforeDate, setBeforeDate] = useState(dates[dates.length - 1].date);
  const [afterDate, setAfterDate] = useState(dates[0].date);
  const [angle, setAngle] = useState("front");
  const [mode, setMode] = useState("side"); // side | overlay
  const [blend, setBlend] = useState(0.5);
  const [shareStatus, setShareStatus] = useState("idle");

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

  const byDate = useMemo(() => new Map(dates.map((g) => [g.date, g])), [dates]);
  const beforeGroup = byDate.get(beforeDate);
  const afterGroup = byDate.get(afterDate);
  const before = photoFor(beforeGroup, angle);
  const after = photoFor(afterGroup, angle);

  const anglesPresent = useMemo(() => {
    const s = new Set();
    for (const g of [beforeGroup, afterGroup]) for (const p of g?.items ?? []) s.add(p.angle);
    return s;
  }, [beforeGroup, afterGroup]);

  const deltaLines = useMemo(() => {
    const lines = [];
    const d1 = new Date(beforeDate);
    const d2 = new Date(afterDate);
    const days = Math.abs(Math.round((d2 - d1) / 86400000));
    if (days) lines.push(`${days} day${days === 1 ? "" : "s"} apart`);
    const b1 = bodyByDate?.[beforeDate];
    const b2 = bodyByDate?.[afterDate];
    if (b1?.weight != null && b2?.weight != null) {
      const d = Math.round((b2.weight - b1.weight) * 10) / 10;
      lines.push(`${d > 0 ? "+" : ""}${d} ${unit}`);
    }
    if (b1?.fat != null && b2?.fat != null) {
      const d = Math.round((b2.fat - b1.fat) * 10) / 10;
      lines.push(`${d > 0 ? "+" : ""}${d}% body fat`);
    }
    return lines;
  }, [beforeDate, afterDate, bodyByDate, unit]);

  async function onShare() {
    if (!before || !after) return;
    setShareStatus("working");
    try {
      const blob = await buildPhotoCompareBlob({
        beforeUrl: before.url,
        afterUrl: after.url,
        beforeLabel: shortDate(beforeDate),
        afterLabel: shortDate(afterDate),
        deltaLines,
      });
      const file = new File([blob], "skill-progress.png", { type: "image/png" });
      const caption = `My progress, ${shortDate(beforeDate)} to ${shortDate(afterDate)}. Tracked in SKILL by @salvador_skfitness`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        setShareStatus("shared");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skill-progress.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShareStatus("downloaded");
    } catch {
      setShareStatus("idle");
    }
  }

  const dateOptions = dates.map((g) => g.date);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Compare photos">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-semibold text-fg">Compare</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-dim">
            Before
            <select
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              className="rounded-field border border-border bg-surface px-2 py-1.5 text-sm text-fg focus:border-accent"
            >
              {dateOptions.map((d) => (
                <option key={d} value={d}>{shortDate(d)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-dim">
            After
            <select
              value={afterDate}
              onChange={(e) => setAfterDate(e.target.value)}
              className="rounded-field border border-border bg-surface px-2 py-1.5 text-sm text-fg focus:border-accent"
            >
              {dateOptions.map((d) => (
                <option key={d} value={d}>{shortDate(d)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["front", "side", "back"].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              disabled={!anglesPresent.has(a)}
              className={`rounded-field border px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:opacity-30 ${
                angle === a ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-fg"
              }`}
            >
              {a}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {["side", "overlay"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-field border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                mode === m ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-fg"
              }`}
            >
              {m === "side" ? "Side by side" : "Overlay"}
            </button>
          ))}
        </div>

        {!before || !after ? (
          <p className="py-10 text-center text-sm text-muted">No photo for that angle on one of those dates.</p>
        ) : mode === "side" ? (
          <div className="grid grid-cols-2 gap-2">
            <Figure url={before.url} label={`Before . ${shortDate(beforeDate)}`} />
            <Figure url={after.url} label={`After . ${shortDate(afterDate)}`} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-card border border-border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={before.url} alt="before" className="absolute inset-0 h-full w-full object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={after.url}
                alt="after"
                className="absolute inset-0 h-full w-full object-contain"
                style={{ opacity: blend }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blend}
              onChange={(e) => setBlend(Number(e.target.value))}
              className="w-full accent-accent"
              aria-label="Blend before and after"
            />
            <div className="flex justify-between text-[11px] text-dim">
              <span>{shortDate(beforeDate)}</span>
              <span>{shortDate(afterDate)}</span>
            </div>
          </div>
        )}

        {deltaLines.length ? (
          <p className="text-center text-sm text-muted">{deltaLines.join("  .  ")}</p>
        ) : null}
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={onShare}
          disabled={!before || !after || shareStatus === "working"}
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-50"
        >
          {shareStatus === "working"
            ? "Building..."
            : shareStatus === "shared"
              ? "Shared"
              : shareStatus === "downloaded"
                ? "Saved to your device"
                : "Share before / after"}
        </button>
      </div>
    </div>
  );
}

function Figure({ url, label }) {
  return (
    <figure className="flex flex-col gap-1">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="h-full w-full object-cover" />
      </div>
      <figcaption className="text-center text-[11px] text-dim">{label}</figcaption>
    </figure>
  );
}
