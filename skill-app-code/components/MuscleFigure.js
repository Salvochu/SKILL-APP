import { muscleImageSrc, figureMuscleFor } from "@/lib/muscleImage";

// The worked muscle drawn on a body figure, for an exercise detail view.
// Renders nothing when the exercise's muscles have no figure (e.g. a
// timed hold, or adductor / hip-flexor work).
export default function MuscleFigure({ muscles = [], className = "" }) {
  const pick = figureMuscleFor(muscles);
  if (!pick) return null;
  const src = muscleImageSrc(pick.id);

  return (
    <figure className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="rounded-field border border-border bg-surface-2 px-6 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${pick.name} highlighted on the body`}
          width={340}
          height={936}
          loading="lazy"
          className="h-52 w-auto"
        />
      </div>
      <figcaption className="text-[11px] text-dim">
        Targets <span className="font-medium text-muted">{pick.name}</span>
      </figcaption>
    </figure>
  );
}
