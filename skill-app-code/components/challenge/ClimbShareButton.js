"use client";

import { useState } from "react";
import { buildClimbShareBlob } from "@/lib/climbShare";

// Renders the climb-card PNG and hands it to the OS share sheet (or
// downloads it, on desktop / when Web Share isn't available). Shared by
// the Day 7 check-in and the Day 14 complete card - same image, same
// mechanism, just different day/streak/headline going in.
export default function ClimbShareButton({ day, totalDays, streak, headline, caption, label = "Share your progress" }) {
  const [status, setStatus] = useState("idle"); // idle | preparing | shared | downloaded

  async function onShare() {
    setStatus("preparing");
    let blob = null;
    try {
      blob = await buildClimbShareBlob({ day, totalDays, streak, headline });
    } catch {
      /* fall through to text share */
    }
    const file = blob ? new File([blob], "skill-challenge.png", { type: "image/png" }) : null;

    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption });
        setStatus("shared");
        return;
      } catch {
        setStatus("idle");
        return;
      }
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skill-challenge.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("downloaded");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: caption });
      } catch {
        /* cancelled */
      }
    }
    setStatus("idle");
  }

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={status === "preparing"}
      className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      <IconShare className="h-[18px] w-[18px]" />
      {status === "preparing"
        ? "Preparing..."
        : status === "shared"
          ? "Shared"
          : status === "downloaded"
            ? "Saved to your photos"
            : label}
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
