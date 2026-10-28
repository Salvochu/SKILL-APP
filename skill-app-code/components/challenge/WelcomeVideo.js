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
        className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-fg/5 active:bg-fg/10"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black">
          <IconPlay className="ml-0.5 h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold text-fg">{title}</span>
          <span className="text-[13px] text-muted">Watched. Tap to watch again.</span>
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
          className="self-start rounded-lg py-1 text-[14px] font-medium text-muted transition-colors hover:text-fg"
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
