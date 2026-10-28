"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { loomEmbedUrl } from "@/lib/exercises";

// The Education Library: a flat list of teaching videos, each opening in
// a sheet with the Loom embed and its write-up.
export default function EducationList({ videos }) {
  const [openId, setOpenId] = useState(null);
  const open = videos.find((v) => v.id === openId) ?? null;

  return (
    <div className="flex flex-col">
      <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
        {videos.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setOpenId(v.id)}
              className="flex w-full items-start gap-3.5 pl-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
            >
              <span className="mt-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <IconPlay className="ml-0.5 h-4 w-4" />
              </span>
              <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[16px] font-semibold text-fg">{v.title}</span>
                  {v.description ? (
                    <span className="line-clamp-2 text-[13px] leading-snug text-muted">{v.description}</span>
                  ) : null}
                </span>
                <IconChevron className="h-4 w-4 shrink-0 text-dim" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open ? <LessonSheet video={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function LessonSheet({ video, onClose }) {
  const embed = loomEmbedUrl(video.video_url);

  return (
    <Sheet onClose={onClose} ariaLabel={video.title}>
      {(close) => (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">{video.title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            {embed ? (
              <iframe src={embed} title={video.title} allowFullScreen loading="lazy" className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-[14px] text-white/60">Video coming soon</div>
            )}
          </div>

          {video.description ? <p className="text-[15px] leading-relaxed text-fg">{video.description}</p> : null}
        </div>
      )}
    </Sheet>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
