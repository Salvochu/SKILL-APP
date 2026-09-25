"use client";

import { useState } from "react";
import TapLink from "@/components/TapLink";
import LoomEmbed from "@/components/challenge/LoomEmbed";

// The VSL lesson card. The "See how 1:1 coaching works" CTA only shows
// once they've actually pressed play on the video - showing it up front
// reads as a sales pitch before they've heard the pitch.
export default function VslCard({ lesson, loomId, locked, lockedLabel }) {
  const [watched, setWatched] = useState(false);

  return (
    <article className="overflow-hidden rounded-card border border-accent/40 bg-surface">
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Watch this before day 14
        </span>
        <h3 className="font-display text-base font-semibold text-fg">{lesson.title}</h3>
        <p className="text-sm text-muted">{lesson.blurb}</p>
      </div>
      <div className="px-4 pb-4">
        <LoomEmbed
          id={loomId}
          title={lesson.title}
          orientation={lesson.orientation}
          locked={locked}
          lockedLabel={lockedLabel}
          onPlay={() => setWatched(true)}
        />
      </div>
      {watched ? (
        <div className="flex flex-col gap-2 border-t border-border p-4">
          <TapLink
            href="/work-with-me"
            className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            See how 1:1 coaching works
          </TapLink>
          <p className="text-center text-xs text-dim">
            No pressure. Finish your 14 days first.
          </p>
        </div>
      ) : null}
    </article>
  );
}
