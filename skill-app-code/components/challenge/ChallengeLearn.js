import LoomEmbed from "@/components/challenge/LoomEmbed";
import VslCard from "@/components/challenge/VslCard";
import { CHALLENGE_LESSONS } from "@/lib/challenge/curriculum";

// The short course under the day timeline. One card per lesson; the
// `vsl` card ends with the 1:1 call to action. `variant` ("Full Gym" |
// "Dumbbells") picks the right cut for a lesson that has two, e.g. the
// Day A / Day B form walkthroughs, rather than showing both. `start-here`
// is excluded here - it lives only in the "Before you start" card
// (ChallengeStart.js), not duplicated into this list. The VSL itself
// stays locked until `challengeDay` reaches `totalDays` - it's the
// "what happens after 14 days" pitch, so it shouldn't be watchable on
// day 1. Eating out stays locked until day 2, since day 1 has nothing
// to plan around yet.
export default function ChallengeLearn({ variant = "Full Gym", challengeDay = 1, totalDays = 14 }) {
  const vslUnlocked = challengeDay >= totalDays;
  const lessons = CHALLENGE_LESSONS.filter((l) => l.slug !== "start-here");

  return (
    <details open className="group flex flex-col gap-3 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
          Learn
        </h2>
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
      </summary>
      <div className="flex flex-col gap-3">
        {lessons.map((lesson) => {
          const loomId = lesson.loomIdByVariant
            ? (lesson.loomIdByVariant[variant] ?? lesson.loomIdByVariant["Full Gym"])
            : lesson.loomId;

          if (lesson.kind === "vsl") {
            return (
              <VslCard
                key={lesson.slug}
                lesson={lesson}
                loomId={loomId}
                locked={!vslUnlocked}
                lockedLabel={`Unlocks on Day ${totalDays}`}
              />
            );
          }

          const eatingOutLocked = lesson.slug === "eating-out" && challengeDay < 2;
          const isFormWalkthrough = lesson.slug === "day-a-form" || lesson.slug === "day-b-form";

          return (
            <article key={lesson.slug} className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex flex-col gap-1 p-4">
                <h3 className="font-display text-base font-semibold text-fg">{lesson.title}</h3>
                <p className="text-sm text-muted">{lesson.blurb}</p>
              </div>
              <div className="px-4 pb-4">
                <LoomEmbed
                  id={loomId}
                  title={lesson.title}
                  orientation={lesson.orientation}
                  locked={eatingOutLocked}
                  lockedLabel="Unlocks on Day 2"
                />
                {isFormWalkthrough ? (
                  <p className="pt-2 text-xs text-dim">
                    Doing an alternative instead? Stick to the same one throughout the 14 days.
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </details>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
