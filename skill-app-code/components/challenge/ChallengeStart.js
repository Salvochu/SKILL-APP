import WelcomeVideo from "@/components/challenge/WelcomeVideo";
import SetupSteps from "@/components/challenge/SetupSteps";
import SectionSummary from "@/components/challenge/SectionSummary";
import { getLesson } from "@/lib/challenge/curriculum";

// "Before you start" - the first of the reference cards under today's
// session on the Challenge tab, collapsed by default. Reaching this card at all means "Start my 14 days" has
// already been pressed (it lives on the separate ChallengePrep screen,
// shown only before that), so the shine and open-by-default state that
// make sense there would just be stale noise here.
export default function ChallengeStart() {
  const welcome = getLesson("start-here");

  return (
    <details className="group rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden">
      <SectionSummary
        icon={<IconList className="h-5 w-5" />}
        title="Before you start"
        detail="Day 1 photos, your meal plan, the food shop"
      />

      <div className="flex flex-col gap-6 px-4 pb-5 pt-1">
        <WelcomeVideo loomId={welcome?.loomId} title="Start here: how the 14 days work" />
        <SetupSteps />
      </div>
    </details>
  );
}

function IconList(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
    </svg>
  );
}
