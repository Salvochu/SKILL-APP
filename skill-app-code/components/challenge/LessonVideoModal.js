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
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-display text-base font-semibold text-fg">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <LoomEmbed id={loomId} title={title} orientation={orientation} />
      </div>
    </div>
  );
}

function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
