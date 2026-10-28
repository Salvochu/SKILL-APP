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

  const tags =
    exercise.muscles && exercise.muscles.length
      ? exercise.muscles
      : [{ id: exercise.muscle, name: exercise.muscle, role: "primary" }];

  return (
    <Sheet onClose={onClose} ariaLabel={exercise.name}>
      {(close) => (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">{exercise.name}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <IconX />
            </button>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            {embed ? (
              <iframe
                src={embed}
                title={`${exercise.name} form video`}
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[14px] text-white/60">
                Form video coming soon
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((m) => (
                <MusclePill key={m.id} muscle={m.name} subtle={m.role === "secondary"} />
              ))}
              {exercise.equipment ? (
                <span className="rounded-full bg-fg/10 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
                  {exercise.equipment}
                </span>
              ) : null}
              {exercise.video_url ? (
                <a
                  href={exercise.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent"
                >
                  Open on Loom <IconExternal />
                </a>
              ) : null}
            </div>
            {exercise.muscles?.some((m) => m.role === "secondary") ? (
              <p className="text-[12px] text-dim">Faded tags are assisting muscles.</p>
            ) : null}
          </div>

          {exercise.instructions || figureMuscleFor(exercise.muscles ?? []) ? (
            <div className={`flex gap-4 ${exercise.instructions ? "" : "items-center"}`}>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {exercise.instructions ? (
                  <>
                    <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
                      How to perform
                    </h3>
                    <p className="text-[15px] leading-relaxed text-fg">{exercise.instructions}</p>
                  </>
                ) : (
                  <p className="text-[15px] text-muted">
                    Works your{" "}
                    <span className="font-semibold text-fg">
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
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href={`/log?exercise=${exercise.id}`}
                className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-transform active:scale-[0.98]"
              >
                Log this exercise
              </Link>
              <Link
                href={`/library/exercises/${exercise.id}`}
                className="flex w-full items-center justify-center rounded-2xl bg-fg/10 px-4 py-3.5 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98]"
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
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
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
