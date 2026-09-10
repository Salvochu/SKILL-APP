import { muscleImageSrc, figureMuscleFor } from "@/lib/muscleImage";

// The worked muscle drawn on a body figure, for an exercise detail view.
// Renders nothing when the exercise's muscles have no figure (e.g. a
// timed hold, or adductor / hip-flexor work). `compact` is the small
// version that sits beside the "how to perform" text.
export default function MuscleFigure({ muscles = [], compact = false, className = "" }) {
  const pick = figureMuscleFor(muscles);
  if (!pick) return null;
  const src = muscleImageSrc(pick.id);

  if (compact) {
    return (
      <figure className={`flex shrink-0 flex-col items-center gap-1 ${className}`}>
        <div className="flex items-center justify-center rounded-field border border-border bg-bg/50 p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${pick.name} highlighted on the body`}
            loading="lazy"
            className="h-28 w-auto max-w-[104px] object-contain"
          />
        </div>
        <figcaption className="max-w-[112px] text-center text-[10px] leading-tight text-dim">
          {pick.name}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center rounded-field border border-border bg-surface-2 px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${pick.name} highlighted on the body`}
          loading="lazy"
          className="h-48 w-auto max-w-[240px] object-contain"
        />
      </div>
      <figcaption className="text-[11px] text-dim">
        Targets <span className="font-medium text-muted">{pick.name}</span>
      </figcaption>
    </figure>
  );
}
