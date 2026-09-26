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
      className="btn-shine flex w-full items-center justify-center gap-2 rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
    >
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
