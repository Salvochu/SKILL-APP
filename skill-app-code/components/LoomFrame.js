"use client";

import { useState } from "react";

// A Loom player filling a box the parent has already sized. Loom's page
// paints white before its own dark player is ready, so the frame stays
// hidden over a dark spinner until it has loaded (same as the challenge's
// LoomEmbed). `lazy` for players in a list that may never be scrolled to.
export default function LoomFrame({ src, title, lazy = false }) {
  // Per src, so switching to another video shows the spinner again.
  const [loadedSrc, setLoadedSrc] = useState(null);
  const loaded = loadedSrc === src;
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#2a2622] to-[#141210]">
      {loaded ? null : (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
        </span>
      )}
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading={lazy ? "lazy" : undefined}
        onLoad={() => setLoadedSrc(src)}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
