"use client";

import { useState } from "react";
import { buildProgressShareBlob } from "@/lib/progressShare";

// "Share progress" button: renders a branded PNG of the current range's
// headline numbers and top muscles, then hands it to the native share
// sheet, falling back to a download + copied caption.
export default function ShareProgress({ rangeLabel, stats, muscles }) {
  const [status, setStatus] = useState("idle"); // idle | working | shared | downloaded

  async function onShare() {
    setStatus("working");
    try {
      const blob = await buildProgressShareBlob({ rangeLabel, stats, muscles });
      const file = new File([blob], "skill-progress.png", { type: "image/png" });
      const caption = `My training progress${rangeLabel ? ` (${rangeLabel})` : ""}. Tracked in SKILL by @salvador_skfitness`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        setStatus("shared");
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
      try {
        await navigator.clipboard?.writeText(caption);
      } catch {
        // clipboard is best-effort
      }
      setStatus("downloaded");
    } catch {
      setStatus("idle");
    }
  }

  const label =
    status === "working"
      ? "Building..."
      : status === "shared"
        ? "Shared"
        : status === "downloaded"
          ? "Saved to your device"
          : "Share progress";

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={status === "working"}
      className="inline-flex shrink-0 items-center gap-2 rounded-field border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg disabled:opacity-60"
    >
      <IconShare className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconShare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12v8h16v-8M12 16V4M8 8l4-4 4 4" />
    </svg>
  );
}
