import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import TodayVideo from "@/components/challenge/TodayVideo";
import ChallengeChecklist from "@/components/challenge/ChallengeChecklist";

const KIND_LABEL = { train: "Training", cardio: "Cardio", rest: "Rest" };

// The one card that matters today: what to do, the video for it, a
// button straight into the logger for training days, and today's
// checklist.
export default function ChallengeToday({ day, challengeDay, mesoId, variant, items, itemsAt }) {
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
        <TodayVideo day={challengeDay} loomId={day.loomId} title={`Day ${day.day}: ${day.title}`} />
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
        <ChallengeChecklist day={challengeDay} kind={day.kind} items={items} itemsAt={itemsAt} />
      </div>

      <TapLink
        href="/body"
        className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-surface-2"
      >
        <span>Log today&apos;s weight</span>
        <IconArrow className="h-4 w-4 shrink-0" />
      </TapLink>
    </section>
  );
}

function IconArrow(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
