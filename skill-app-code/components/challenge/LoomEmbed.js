"use client";

import { useState } from "react";

// A Loom video. Renders a lightweight poster until tapped, then swaps in
// the real iframe (so a page with several videos does not load them all
// up front). `id` is the share-link's last path segment; when it is
// null the slot shows a "filming" placeholder instead. `orientation`
// picks the box shape: "vertical" (default, 9:16 - the daily check-ins
// and the welcome video) or "horizontal" (16:9 - the Learn lessons).
// `locked`, with `lockedLabel`, shows a lock placeholder instead of the
// video regardless of `id` - used for the VSL, which only unlocks on
// Day 14 (see ChallengeLearn.js).
export default function LoomEmbed({
  id,
  title = "Watch",
  className = "",
  orientation = "vertical",
  locked = false,
  lockedLabel = "Unlocks soon",
}) {
  const [playing, setPlaying] = useState(false);
  const aspect = orientation === "horizontal" ? "aspect-video" : "aspect-[9/16]";

  if (locked) {
    return (
      <div
        className={`flex ${aspect} w-full flex-col items-center justify-center gap-1.5 rounded-field border border-dashed border-border bg-surface text-center ${className}`}
      >
        <IconLock className="h-6 w-6 text-dim" />
        <span className="text-xs font-medium text-muted">{lockedLabel}</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div
        className={`flex ${aspect} w-full flex-col items-center justify-center gap-1.5 rounded-field border border-dashed border-border bg-surface text-center ${className}`}
      >
        <IconFilm className="h-6 w-6 text-dim" />
        <span className="text-xs font-medium text-muted">Video coming soon</span>
        <span className="px-6 text-[11px] text-dim">Salvador is filming this one</span>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={`relative ${aspect} w-full overflow-hidden rounded-field border border-border bg-black ${className}`}>
        <iframe
          src={`https://www.loom.com/embed/${id}?autoplay=1&hide_owner=true&hide_share=true&hideEmbedTopBar=true`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`group relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-field border border-border bg-gradient-to-b from-surface-2 to-surface transition-colors hover:border-border-strong ${className}`}
      aria-label={`Play video: ${title}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg transition-transform group-hover:scale-105">
        <IconPlay className="ml-0.5 h-6 w-6" />
      </span>
      <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs font-medium text-white">
        {title}
      </span>
    </button>
  );
}

function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconFilm(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  );
}
