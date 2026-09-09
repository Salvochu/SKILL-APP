import GuardedStartLink from "@/components/log/GuardedStartLink";
import LoomEmbed from "@/components/challenge/LoomEmbed";
import ChallengeChecklist from "@/components/challenge/ChallengeChecklist";

const KIND_LABEL = { train: "Training", cardio: "Cardio", rest: "Rest" };

// The one card that matters today: what to do, the video for it, a
// button straight into the logger for training days, and today's
// checklist.
export default function ChallengeToday({ day, challengeDay, mesoId, variant, items }) {
  if (!day) return null;
  const trainHref =
    day.kind === "train" && day.dayTemplateId && mesoId
      ? `/log?meso=${mesoId}&split=main-character-14&day=${day.dayTemplateId}&variant=${encodeURIComponent(variant || "Full Gym")}`
      : null;

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Day {challengeDay} &middot; Today &middot; {KIND_LABEL[day.kind] ?? "Today"}
        </span>
        <h2 className="font-display text-xl font-bold text-fg">{day.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{day.what}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        <LoomEmbed id={day.loomId} title={`Day ${day.day}: ${day.title}`} />
        {trainHref ? (
          <GuardedStartLink
            href={trainHref}
            className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
          >
            Start {day.title}
          </GuardedStartLink>
        ) : null}
      </div>

      <div className="border-t border-border">
        <ChallengeChecklist day={challengeDay} kind={day.kind} items={items} />
      </div>
    </section>
  );
}
