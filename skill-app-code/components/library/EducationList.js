"use client";

import { useEffect, useState } from "react";
import { loomEmbedUrl } from "@/lib/exercises";

// The Education Library: a flat list of teaching videos, each opening in
// a modal with the Loom embed and its write-up.
export default function EducationList({ videos }) {
  const [openId, setOpenId] = useState(null);
  const open = videos.find((v) => v.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-2.5">
      {videos.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => setOpenId(v.id)}
          className="flex w-full items-start gap-3 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconPlay className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-display text-base font-semibold text-fg">{v.title}</span>
            {v.description ? (
              <span className="line-clamp-2 text-sm text-muted">{v.description}</span>
            ) : null}
          </span>
        </button>
      ))}

      {open ? <LessonModal video={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function LessonModal({ video, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const embed = loomEmbedUrl(video.video_url);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={video.title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-fg">{video.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded-field p-1.5 text-dim transition-colors hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-4 aspect-video w-full overflow-hidden rounded-field border border-border bg-black">
          {embed ? (
            <iframe src={embed} title={video.title} allowFullScreen loading="lazy" className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-dim">Video coming soon</div>
          )}
        </div>

        {video.description ? <p className="mt-4 text-sm text-fg">{video.description}</p> : null}
      </div>
    </div>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
