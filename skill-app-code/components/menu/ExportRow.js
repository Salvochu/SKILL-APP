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
      className="block w-full text-left transition-colors hover:bg-surface-2 active:bg-surface-2 disabled:opacity-70"
    >
      <div className="flex items-center gap-3 pl-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white"
          style={{ backgroundColor: TINT }}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
        </span>
        {/* menu-sep: the row's hairline, hidden when it's first in its group. */}
        <div className="menu-sep flex min-w-0 flex-1 flex-col border-t border-border/70 py-3 pr-4">
          <span className="text-[16px] text-fg">Export training log</span>
          <span className={`truncate text-[13px] ${state === "error" ? "text-danger" : "text-dim"}`}>{body}</span>
        </div>
      </div>
    </button>
  );
}
