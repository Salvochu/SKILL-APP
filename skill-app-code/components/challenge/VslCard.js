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
    <article className="flex flex-col gap-3.5 rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-4">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          Watch this on day 14
        </span>
        <h3 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">{lesson.title}</h3>
        <p className="text-[15px] leading-relaxed text-muted">{lesson.blurb}</p>
      </div>
      <div>
        <LoomEmbed
          id={loomId}
          title={lesson.title}
          orientation={lesson.orientation}
          locked={locked}
          lockedLabel={lockedLabel}
          onPlay={() => setWatched(true)}
          loomLink
        />
      </div>
      {watched ? (
        <div className="flex flex-col gap-2 pt-1">
          <TapLink
            href="/work-with-me"
            className="btn-shine flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
          >
            See how 1:1 coaching works
          </TapLink>
          <p className="text-center text-[13px] text-dim">
            No pressure. Finish your 14 days first.
          </p>
        </div>
      ) : null}
    </article>
  );
}
