"use client";

import { useEffect } from "react";
import { loomEmbedUrl } from "@/lib/exercises";
import { figureMuscleFor } from "@/lib/muscleImage";
import MuscleFigure from "@/components/MuscleFigure";

export default function VideoModal({ exercise, onClose }) {
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
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-fg">{exercise.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-field border border-border bg-black">
          {embed ? (
            <iframe src={embed} title={`${exercise.name} form video`} allowFullScreen className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-dim">Form video coming soon</div>
          )}
        </div>
        {exercise.instructions || figureMuscleFor(exercise.muscles ?? []) ? (
          <div
            className={`mt-3 flex gap-3 rounded-field bg-surface-2 p-3 ${
              exercise.instructions ? "" : "items-center"
            }`}
          >
            <div className="min-w-0 flex-1">
              {exercise.instructions ? (
                <p className="text-sm text-muted">{exercise.instructions}</p>
              ) : (
                <p className="text-sm text-muted">
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
      </div>
    </div>
  );
}
