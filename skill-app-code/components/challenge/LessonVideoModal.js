"use client";

import { useEffect } from "react";
import LoomEmbed from "@/components/challenge/LoomEmbed";

// A single Loom lesson in a popup, for a setup-step button that shouldn't
// permanently take up space in the card (e.g. "Watch: how to read your
// meal plan" in SetupSteps.js). Same overlay/close pattern as the
// exercise VideoModal in components/log/VideoModal.js.
export default function LessonVideoModal({ loomId, title, orientation = "horizontal", onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-strong pop-in relative w-full max-w-lg rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3 pb-3 pl-1">
          <h2 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
          >
            <IconClose className="h-[18px] w-[18px]" />
          </button>
        </div>
        <LoomEmbed id={loomId} title={title} orientation={orientation} />
      </div>
    </div>
  );
}

function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
