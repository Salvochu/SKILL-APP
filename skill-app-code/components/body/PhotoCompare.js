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
    const b1 = bodyByDate?.[beforeDate];
    const b2 = bodyByDate?.[afterDate];
    if (b1?.weight != null && b2?.weight != null) {
      const d = Math.round((b2.weight - b1.weight) * 10) / 10;
      lines.push(`${d > 0 ? "+" : ""}${d} ${unit}`);
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
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <h2 className="font-display text-[1.75rem] font-bold tracking-[-0.02em] text-fg">Compare</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          <DateSelect label="Before" value={beforeDate} onChange={setBeforeDate} options={dateOptions} />
          <DateSelect label="After" value={afterDate} onChange={setAfterDate} options={dateOptions} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Angle"
            value={angle}
            onChange={setAngle}
            options={[["front", "Front"], ["side", "Side"], ["back", "Back"]]}
            isDisabled={(a) => !anglesPresent.has(a)}
          />
          <Segmented
            label="View"
            value={mode}
            onChange={setMode}
            options={[["side", "Side by side"], ["overlay", "Overlay"]]}
          />
        </div>

        {!before || !after ? (
          <p className="py-10 text-center text-[15px] text-muted">No photo for that angle on one of those dates.</p>
        ) : mode === "side" ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Figure url={before.url} label={`Before · ${shortDate(beforeDate)}`} />
            <Figure url={after.url} label={`After · ${shortDate(afterDate)}`} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
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
            <div className="flex justify-between text-[13px] text-muted">
              <span>{shortDate(beforeDate)}</span>
              <span>{shortDate(afterDate)}</span>
            </div>
          </div>
        )}

        {deltaLines.length ? (
          <p className="text-center text-[17px] font-semibold text-fg tabular-nums">{deltaLines.join(" · ")}</p>
        ) : null}
      </div>

      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={onShare}
          disabled={!before || !after || shareStatus === "working"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-[transform,opacity] active:scale-[0.98] disabled:opacity-50"
        >
          <IconShare className="h-[18px] w-[18px]" />
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

function DateSelect({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="px-1 text-[13px] font-medium text-muted">{label}</span>
      <span className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 cursor-pointer appearance-none rounded-xl bg-fg/[0.07] py-2.5 pl-3.5 pr-9 text-[16px] font-medium text-fg outline-none focus:ring-2 focus:ring-accent/60"
        >
          {options.map((d) => (
            <option key={d} value={d}>{shortDate(d)}</option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute right-3 h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
        </svg>
      </span>
    </label>
  );
}

// An iOS-style segmented control.
function Segmented({ label, value, onChange, options, isDisabled = () => false }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-fg/[0.07] p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          disabled={isDisabled(key)}
          aria-pressed={value === key}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-30 ${
            value === key ? "bg-fg text-bg" : "text-muted enabled:hover:text-fg"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Figure({ url, label }) {
  return (
    <figure className="flex flex-col gap-1.5">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="h-full w-full object-cover" />
      </div>
      <figcaption className="text-center text-[13px] text-muted">{label}</figcaption>
    </figure>
  );
}

function IconShare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H16" />
    </svg>
  );
}
