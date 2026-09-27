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
    <details className="group relative overflow-hidden rounded-card border border-accent/30 [&_summary::-webkit-details-marker]:hidden">
      <div
        aria-hidden="true"
        className="cc-bloom pointer-events-none absolute -left-20 -top-16 h-52 w-52 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <summary className="relative flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Before you start
          </span>
          <span className="font-display text-lg font-bold text-fg">
            Set yourself up for the 14 days
          </span>
        </span>
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
      </summary>

      <div className="relative flex flex-col gap-4 border-t border-accent/20 p-5">
        <WelcomeVideo loomId={welcome?.loomId} title="Start here: how the 14 days work" />
        <SetupSteps />
      </div>
    </details>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
