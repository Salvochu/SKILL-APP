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
    <details id="learn" className="group/learn flex flex-col [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-1">
        <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Learn</h2>
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open/learn:rotate-180" />
      </summary>
      <div className="mt-2 flex flex-col gap-3">
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
            <article key={lesson.slug} className="flex flex-col gap-3.5 rounded-2xl bg-surface p-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">{lesson.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{lesson.blurb}</p>
              </div>
              <div>
                <LoomEmbed
                  id={loomId}
                  title={lesson.title}
                  orientation={lesson.orientation}
                  locked={eatingOutLocked}
                  lockedLabel="Unlocks on Day 2"
                  loomLink
                />
                {isFormWalkthrough ? (
                  <p className="pt-2.5 text-[13px] leading-snug text-dim">
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
