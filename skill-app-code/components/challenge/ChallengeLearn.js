import TapLink from "@/components/TapLink";
import LoomEmbed from "@/components/challenge/LoomEmbed";
import { CHALLENGE_LESSONS } from "@/lib/challenge/curriculum";

// The short course under the day timeline. One card per lesson; the
// `vsl` card ends with the 1:1 call to action. `variant` ("Full Gym" |
// "Dumbbells") picks the right cut for a lesson that has two, e.g. the
// Day A / Day B form walkthroughs, rather than showing both. The VSL
// itself stays locked until `challengeDay` reaches `totalDays` - it's
// the "what happens after 14 days" pitch, so it shouldn't be watchable
// on day 1.
export default function ChallengeLearn({ variant = "Full Gym", challengeDay = 1, totalDays = 14 }) {
  const vslUnlocked = challengeDay >= totalDays;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-dim">
        Learn
      </h2>
      <div className="flex flex-col gap-3">
        {CHALLENGE_LESSONS.map((lesson) => {
          const loomId = lesson.loomIdByVariant
            ? (lesson.loomIdByVariant[variant] ?? lesson.loomIdByVariant["Full Gym"])
            : lesson.loomId;
          const vslLocked = lesson.kind === "vsl" && !vslUnlocked;
          return (
            <article
              key={lesson.slug}
              className={`overflow-hidden rounded-card border bg-surface ${
                lesson.kind === "vsl" ? "border-accent/40" : "border-border"
              }`}
            >
              <div className="flex flex-col gap-1 p-4">
                {lesson.kind === "vsl" ? (
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Watch this before day 14
                  </span>
                ) : null}
                <h3 className="font-display text-base font-semibold text-fg">{lesson.title}</h3>
                <p className="text-sm text-muted">{lesson.blurb}</p>
              </div>
              <div className="px-4 pb-4">
                <LoomEmbed
                  id={loomId}
                  title={lesson.title}
                  orientation={lesson.orientation}
                  locked={vslLocked}
                  lockedLabel={`Unlocks on Day ${totalDays}`}
                />
              </div>
              {lesson.kind === "vsl" ? (
                <div className="flex flex-col gap-2 border-t border-border p-4">
                  <TapLink
                    href="/work-with-me"
                    className="btn-shine flex w-full items-center justify-center rounded-field bg-accent px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
                  >
                    See how 1:1 coaching works
                  </TapLink>
                  <p className="text-center text-xs text-dim">
                    No pressure. Finish your 14 days first.
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
