"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "@/lib/glossary";

// A small "?" next to a training term. Tapping it opens a plain-language
// definition. Portalled to <body> so a backdrop-blurred ancestor (the
// nav header) can't trap the dialog.
export default function Explain({ k, label }) {
  const entry = GLOSSARY[k];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function ready() {
      setMounted(true);
    }
    ready();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!entry) return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-16"
      role="dialog"
      aria-modal="true"
      aria-label={entry.term}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-xs rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-bold text-fg">{entry.term}</h2>
        <p className="mt-2 text-sm text-muted">{entry.body}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-field bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Got it
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`What is ${label ?? entry.term}?`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold text-dim transition-colors hover:border-accent hover:text-accent"
      >
        ?
      </button>
      {open && mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
