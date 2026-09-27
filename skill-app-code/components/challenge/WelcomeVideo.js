"use client";

import { useEffect, useState } from "react";
import LoomEmbed from "@/components/challenge/LoomEmbed";

const STORAGE_KEY = "skill:welcome-video-watched";

// The "Start here" welcome video, shown on both ChallengePrep.js (before
// "Start my 14 days") and ChallengeStart.js (the collapsed card after).
// Same minimise-once-watched behaviour as the daily video (TodayVideo.js),
// but there is no per-day server field for "watched the welcome video" to
// key it off, so this tracks it in localStorage instead - a one-off,
// per-device nicety rather than something that needs to sync anywhere.
export default function WelcomeVideo({ loomId, title }) {
  const [expanded, setExpanded] = useState(true);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    function check() {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") {
          setWatched(true);
          setExpanded(false);
        }
      } catch {}
    }
    check();
  }, []);

  function markWatched() {
    setWatched(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

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
      <LoomEmbed id={loomId} title={title} onPlay={markWatched} />
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
