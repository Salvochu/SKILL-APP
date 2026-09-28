"use client";

import { useEffect, useState } from "react";

// A single image in a popup - used by ChallengeWelcome.js's home-screen
// step so the screenshot stays tucked behind a "See screenshot" button
// instead of always taking up space on the step itself. Opens as a small
// preview first; tapping the image expands it to full size (and tapping
// again shrinks it back), rather than dumping a full-size screenshot on
// screen immediately.
export default function ImageModal({ src, alt, onClose }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/80" />
      <div className={`relative transition-[width] duration-200 ${expanded ? "w-full max-w-sm" : "w-44"}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-10 right-0 rounded-field p-1.5 text-white/80 transition-colors hover:text-white"
        >
          <IconClose className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group relative block w-full overflow-hidden rounded-field border border-border shadow-2xl"
        >
          <img src={src} alt={alt} className="w-full" />
          {!expanded ? (
            <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
              <IconExpand className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </button>

        {!expanded ? <p className="mt-2 text-center text-xs text-white/70">Tap to expand</p> : null}
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

function IconExpand(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3H3v6M15 3h6v6M21 15v6h-6M3 15v6h6" />
    </svg>
  );
}
