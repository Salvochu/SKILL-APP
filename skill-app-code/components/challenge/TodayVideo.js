"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LoomEmbed from "@/components/challenge/LoomEmbed";
import { setChecklistItem } from "@/app/(app)/challenge/actions";

// Today's video on the Challenge tab. Pressing play also ticks "Watched
// today's video" on the checklist below - one less box to remember, and
// still manually toggleable either way if they click by accident.
//
// Once it has been watched (this visit or an earlier one), it starts
// minimised to a small "watch again" row instead of the full player, so
// the page does not stay long once there is nothing new to watch. A
// "Minimise" link appears once it is both playing and already marked
// watched, so there is also a way to collapse it without waiting for a
// fresh page load.
export default function TodayVideo({ day, loomId, title, watched = false }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(!watched);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="-mx-1 flex items-center gap-3 rounded-field px-1 py-1 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-black">
          <IconPlay className="ml-0.5 h-3.5 w-3.5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-fg">{title}</span>
          <span className="text-xs text-dim">Watched. Tap to watch again.</span>
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <LoomEmbed
        id={loomId}
        title={title}
        onPlay={() => {
          setChecklistItem(day, "video", true)
            .then(() => router.refresh())
            .catch(() => {});
        }}
      />
      {watched ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="self-start text-xs font-medium text-dim hover:text-fg"
        >
          Minimise
        </button>
      ) : null}
    </div>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
