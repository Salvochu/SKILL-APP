"use client";

import Link from "next/link";
import { loomEmbedUrl } from "@/lib/exercises";
import { figureMuscleFor } from "@/lib/muscleImage";
import MusclePill from "@/components/MusclePill";
import MuscleFigure from "@/components/MuscleFigure";
import Sheet from "@/components/Sheet";

// Bottom-sheet detail for one exercise: form video, how-to, quick log link.
export default function ExerciseSheet({ exercise, onClose, canLog = true }) {
  if (!exercise) return null;
  const embed = loomEmbedUrl(exercise.video_url);

  return (
    <Sheet onClose={onClose} ariaLabel={exercise.name}>
      {(close) => (
        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] sm:pb-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-fg">{exercise.name}</h2>
          <button
            type="button"
            onClick={close}
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
          {(exercise.muscles && exercise.muscles.length
            ? exercise.muscles
            : [{ id: exercise.muscle, name: exercise.muscle, role: "primary" }]
          ).map((m) => (
            <MusclePill key={m.id} muscle={m.name} subtle={m.role === "secondary"} />
          ))}
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

        {exercise.muscles?.some((m) => m.role === "secondary") ? (
          <p className="mt-2 text-[11px] text-dim">Faded tags are assisting muscles.</p>
        ) : null}

        {exercise.instructions || figureMuscleFor(exercise.muscles ?? []) ? (
          <div
            className={`mt-4 flex gap-3 rounded-field bg-surface-2 p-3 ${
              exercise.instructions ? "" : "items-center"
            }`}
          >
            <div className="min-w-0 flex-1">
              {exercise.instructions ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-dim">
                    How to perform
                  </p>
                  <p className="mt-1 text-sm text-fg">{exercise.instructions}</p>
                </>
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

        {canLog ? (
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/log?exercise=${exercise.id}`}
              className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 font-semibold text-black transition-colors hover:bg-accent-2 active:bg-accent-2"
            >
              Log this exercise
            </Link>
            <Link
              href={`/library/exercises/${exercise.id}`}
              className="flex w-full items-center justify-center rounded-field border border-border px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2 active:bg-accent-soft"
            >
              Your history
            </Link>
          </div>
        ) : null}
        </div>
      )}
    </Sheet>
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
