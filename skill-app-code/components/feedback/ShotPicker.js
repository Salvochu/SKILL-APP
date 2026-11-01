"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/imageResize";

// Attach one screenshot to a feedback message. The image is shrunk to a
// JPEG on the phone before it goes anywhere. `shot` is { blob, url } or
// null; the parent owns it so it can send it with the message.
export default function ShotPicker({ shot, onChange, compact = false }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Free the preview's memory when it's replaced or the form goes away.
  useEffect(() => () => shot?.url && URL.revokeObjectURL(shot.url), [shot]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob } = await compressImage(file, { maxEdge: 1600, quality: 0.8 });
      if (!blob) throw new Error("no image");
      onChange({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError("Couldn't read that image. Try another.");
    }
    setBusy(false);
  }

  const picker = (
    <input ref={input} type="file" accept="image/*" onChange={onFile} className="hidden" aria-hidden="true" tabIndex={-1} />
  );

  if (shot) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img src={shot.url} alt="Your screenshot" className="h-16 w-16 rounded-lg object-cover ring-1 ring-border" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-lg py-1 text-[14px] font-medium text-muted transition-opacity active:opacity-60"
        >
          Remove
        </button>
        {picker}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Add a screenshot"
        className={
          compact
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-transform active:scale-95 disabled:opacity-50"
            : "flex items-center gap-2 self-start rounded-xl bg-surface-2 px-3.5 py-2.5 text-[14px] font-semibold text-muted transition-transform active:scale-[0.98] disabled:opacity-50"
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-4.5-4.5L6 21" />
        </svg>
        {compact ? null : busy ? "Adding..." : "Add a screenshot"}
      </button>
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
      {picker}
    </div>
  );
}
