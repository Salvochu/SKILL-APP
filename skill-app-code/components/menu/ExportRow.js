"use client";

import { useState } from "react";

const TINT = "#3fb6a8";

// Fetches the CSV and hands it to the browser without navigating away, so
// there is no dead-end API page to get stuck on. iOS may open the file in
// a viewer; the app itself is never left.
export default function ExportRow() {
  const [state, setState] = useState("idle"); // idle | working | done | error

  async function run() {
    setState("working");
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skill-training-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setState("done");
    } catch {
      setState("error");
    }
  }

  const body =
    state === "working"
      ? "Preparing your file..."
      : state === "done"
        ? "Downloaded. Check your files."
        : state === "error"
          ? "Could not export. Try again."
          : "Download every set you have logged as a CSV";

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === "working"}
      className="block w-full text-left transition-colors hover:bg-surface-2 active:bg-accent-soft disabled:opacity-70"
    >
      <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ color: TINT, backgroundColor: `color-mix(in srgb, ${TINT} 16%, transparent)` }}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-fg">Export training log</span>
          <span className="truncate text-xs text-dim">{body}</span>
        </div>
      </div>
    </button>
  );
}
