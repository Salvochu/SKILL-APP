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
// Day 14 (see ChallengeLearn.js). `loomLink` adds a "Watch on Loom" pill
// under the player, straight to the share page - used only for the Learn
// lessons, where the Loom page itself may have links/resources attached
// that the embedded player doesn't surface. `autoPlay` skips the poster
// (for a video someone has just tapped to open, e.g. in LessonList.js).
export default function LoomEmbed({
  id,
  title = "Watch",
  className = "",
  orientation = "vertical",
  locked = false,
  lockedLabel = "Unlocks soon",
  loomLink = false,
  onPlay,
  autoPlay = false,
}) {
  const [playing, setPlaying] = useState(autoPlay);
  // The Loom page paints white before its own dark player appears, so the
  // frame stays hidden over a dark, spinning placeholder until it loads.
  const [loaded, setLoaded] = useState(false);
  const aspect = orientation === "horizontal" ? "aspect-video" : "aspect-[9/16]";

  if (locked) {
    return (
      <div
        className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl bg-fg/[0.05] text-center ${className}`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fg/10 text-muted">
          <IconLock className="h-5 w-5" />
        </span>
        <span className="text-[14px] font-medium text-muted">{lockedLabel}</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div
        className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl bg-fg/[0.05] text-center ${className}`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fg/10 text-muted">
          <IconFilm className="h-5 w-5" />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-muted">Video coming soon</span>
          <span className="px-6 text-[13px] text-dim">Salvador is filming this one</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {playing ? (
        <div
          className={`relative ${aspect} w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#2a2622] to-[#141210] ${className}`}
        >
          {loaded ? null : (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
            </span>
          )}
          <iframe
            src={`https://www.loom.com/embed/${id}?autoplay=1&hide_owner=true&hide_share=true&hideEmbedTopBar=true`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            onPlay?.();
          }}
          className={`group relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#2a2622] to-[#141210] transition-transform active:scale-[0.99] ${className}`}
          aria-label={`Play video: ${title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black shadow-[0_10px_28px_-8px_rgba(252,118,5,0.7)] transition-transform group-hover:scale-105 group-active:scale-95">
            <IconPlay className="ml-1 h-7 w-7" />
          </span>
          <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent px-4 pb-3.5 pt-8 text-left text-[14px] font-semibold text-white">
            {title}
          </span>
        </button>
      )}
      {loomLink ? (
        <a
          href={`https://www.loom.com/share/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 self-start rounded-full bg-accent-soft px-3.5 py-2 text-[13px] font-semibold text-accent transition-[background-color,color,transform] hover:bg-accent hover:text-black active:scale-95"
        >
          <IconExternal className="h-3.5 w-3.5" />
          Watch on Loom
        </a>
      ) : null}
    </div>
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
function IconExternal(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
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
