"use client";

import { useEffect } from "react";

// A single image in a popup - used by ChallengeWelcome.js's home-screen
// step so the screenshot stays tucked behind a "See screenshot" button
// instead of always taking up space on the step itself.
export default function ImageModal({ src, alt, onClose }) {
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
      <div className="relative w-full max-w-sm">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-10 right-0 rounded-field p-1.5 text-white/80 transition-colors hover:text-white"
        >
          <IconClose className="h-5 w-5" />
        </button>
        <img src={src} alt={alt} className="w-full rounded-field border border-border" />
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
