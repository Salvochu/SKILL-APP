"use client";

import { useEffect } from "react";
import Link from "next/link";
import { loomEmbedUrl } from "@/lib/exercises";
import MusclePill from "@/components/MusclePill";

// Bottom-sheet detail for one exercise: form video, how-to, quick log link.
export default function ExerciseSheet({ exercise, onClose, canLog = true }) {
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

  if (!exercise) return null;
  const embed = loomEmbedUrl(exercise.video_url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={exercise.name}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-fg">{exercise.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-field p-1.5 text-dim transition-colors hover:text-fg"
          >
            <IconX />
          </button>
        </div>

        <div className="mt-4 aspect-video w-full overflow-hidden rounded-field border border-border bg-black">
          {embed ? (
            <iframe
              src={embed}
              title={`${exercise.name} form video`}
              allowFullScreen
              loading="lazy"
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-dim">
              Form video coming soon
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MusclePill muscle={exercise.muscle} />
          {exercise.equipment ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
              {exercise.equipment}
            </span>
          ) : null}
          {exercise.video_url ? (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Open on Loom <IconExternal />
            </a>
          ) : null}
        </div>

        {exercise.instructions ? (
          <div className="mt-4 rounded-field bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-dim">
              How to perform
            </p>
            <p className="mt-1 text-sm text-fg">{exercise.instructions}</p>
          </div>
        ) : null}

        {canLog ? (
          <Link
            href={`/log?exercise=${exercise.id}`}
            className="mt-4 flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Log this exercise
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
