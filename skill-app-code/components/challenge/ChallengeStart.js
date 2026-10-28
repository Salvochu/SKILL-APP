import WelcomeVideo from "@/components/challenge/WelcomeVideo";
import SetupSteps from "@/components/challenge/SetupSteps";
import { getLesson } from "@/lib/challenge/curriculum";

// "Before you start" - pinned at the top of the Challenge tab, collapsed
// by default. Reaching this card at all means "Start my 14 days" has
// already been pressed (it lives on the separate ChallengePrep screen,
// shown only before that), so the shine and open-by-default state that
// make sense there would just be stale noise here.
export default function ChallengeStart() {
  const welcome = getLesson("start-here");

  return (
    <details className="group rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3.5 rounded-2xl p-4 transition-colors active:bg-surface-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <IconList className="h-5 w-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">Before you start</span>
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Set yourself up for the 14 days</span>
        </span>
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
      </summary>

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

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
