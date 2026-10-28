"use client";

import { useEffect } from "react";
import { loomEmbedUrl } from "@/lib/exercises";
import { figureMuscleFor } from "@/lib/muscleImage";
import MuscleFigure from "@/components/MuscleFigure";

export default function VideoModal({ exercise, onClose, actionLabel = null, onAction = null }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!exercise) return null;
  const embed = loomEmbedUrl(exercise.video_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={exercise.name}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-strong pop-in relative flex w-full max-w-lg flex-col gap-3.5 rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3 pl-1">
          <h2 className="min-w-0 font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">{exercise.name}</h2>
          <button
            type="button"
            onClick={onClose}
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
            <iframe src={embed} title={`${exercise.name} form video`} allowFullScreen className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-[14px] text-white/60">Form video coming soon</div>
          )}
        </div>
        {exercise.instructions || figureMuscleFor(exercise.muscles ?? []) ? (
          <div className={`flex gap-3 px-1 ${exercise.instructions ? "" : "items-center"}`}>
            <div className="min-w-0 flex-1">
              {exercise.instructions ? (
                <p className="text-[15px] leading-relaxed text-muted">{exercise.instructions}</p>
              ) : (
                <p className="text-[15px] text-muted">
                  Works your{" "}
                  <span className="font-medium text-fg">
                    {figureMuscleFor(exercise.muscles).name.toLowerCase()}
                  </span>
                  .
                </p>
              )}
            </div>
            <MuscleFigure muscles={exercise.muscles ?? []} compact />
          </div>
        ) : null}

        {onAction && actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="w-full rounded-2xl bg-accent px-4 py-3.5 text-center text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
