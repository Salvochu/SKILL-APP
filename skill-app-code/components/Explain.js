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
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={entry.term}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="glass-strong pop-in relative flex w-full max-w-sm flex-col gap-2 rounded-3xl p-5">
        <h2 className="font-display text-[1.25rem] font-bold leading-tight tracking-[-0.02em] text-fg">{entry.term}</h2>
        <p className="text-[15px] leading-relaxed text-muted">{entry.body}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 w-full rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
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
        className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-fg/10 text-[10px] font-bold normal-case tracking-normal text-muted transition-colors after:absolute after:-inset-2 hover:bg-accent-soft hover:text-accent"
      >
        ?
      </button>
      {open && mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
