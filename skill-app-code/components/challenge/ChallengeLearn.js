import LessonList from "@/components/challenge/LessonList";
import SectionSummary from "@/components/challenge/SectionSummary";
import { CHALLENGE_LESSONS } from "@/lib/challenge/curriculum";

// The short course under the day timeline, in a card that opens on tap:
// a compact list where each lesson plays in a slide-up sheet
// (LessonList.js). `variant` ("Full Gym" | "Dumbbells") picks the right
// cut for a lesson that has two, e.g. the Day A / Day B form
// walkthroughs, rather than showing both. `start-here` is excluded - it
// lives only in the "Before you start" card (ChallengeStart.js). The VSL
// stays locked until `challengeDay` reaches `totalDays` - it's the
// "what happens after 14 days" pitch, so it shouldn't be watchable on
// day 1. Eating out stays locked until day 2, since day 1 has nothing
// to plan around yet. id="learn" is what LearnPrompt.js opens.
export default function ChallengeLearn({ variant = "Full Gym", challengeDay = 1, totalDays = 14 }) {
  const lessons = CHALLENGE_LESSONS.filter((l) => l.slug !== "start-here").map((lesson) => {
    const loomId = lesson.loomIdByVariant
      ? (lesson.loomIdByVariant[variant] ?? lesson.loomIdByVariant["Full Gym"])
      : lesson.loomId;
    const vslLocked = lesson.kind === "vsl" && challengeDay < totalDays;
    const eatingOutLocked = lesson.slug === "eating-out" && challengeDay < 2;
    const isFormWalkthrough = lesson.slug === "day-a-form" || lesson.slug === "day-b-form";
    return {
      slug: lesson.slug,
      title: lesson.title,
      blurb: lesson.blurb,
      loomId,
      orientation: lesson.orientation,
      kind: lesson.kind,
      locked: vslLocked || eatingOutLocked,
      lockedLabel: vslLocked ? `Unlocks on Day ${totalDays}` : "Unlocks on Day 2",
      note: isFormWalkthrough ? "Doing an alternative instead? Stick to the same one throughout the 14 days." : null,
    };
  });
  const open = lessons.filter((l) => !l.locked).length;

  return (
    <details id="learn" className="group rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden">
      <SectionSummary
        icon={<IconPlayCircle className="h-5 w-5" />}
        title="Learn"
        detail={`${lessons.length} short videos · ${open} ready to watch`}
      />
      <LessonList lessons={lessons} />
    </details>
  );
}

function IconPlayCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor" />
    </svg>
  );
}
