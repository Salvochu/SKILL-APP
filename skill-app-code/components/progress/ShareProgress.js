"use client";

import { useState } from "react";
import { buildProgressShareBlob } from "@/lib/progressShare";

// "Share progress" button: renders a branded PNG of the user's level,
// rank, lifetime totals and most-trained muscles, then hands it to the
// native share sheet, falling back to a download + copied caption.
export default function ShareProgress({ levelLabel, tierLabel, tierColor, xpPct, stats, muscles, caption }) {
  const [status, setStatus] = useState("idle"); // idle | working | shared | downloaded

  async function onShare() {
    setStatus("working");
    try {
      const blob = await buildProgressShareBlob({ levelLabel, tierLabel, tierColor, xpPct, stats, muscles });
      const file = new File([blob], "skill-progress.png", { type: "image/png" });
      const text = caption || "My training progress. Tracked in SKILL by @salvador_skfitness";

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
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
        await navigator.clipboard?.writeText(text);
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
          : "Share your progress";

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={status === "working"}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-soft px-4 py-3.5 text-[16px] font-semibold text-accent transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      <IconShare className="h-[18px] w-[18px]" />
      {label}
    </button>
  );
}

function IconShare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H16" />
    </svg>
  );
}
