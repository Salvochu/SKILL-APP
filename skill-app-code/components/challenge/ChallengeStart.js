import LoomEmbed from "@/components/challenge/LoomEmbed";
import { getLesson, SETUP_STEPS } from "@/lib/challenge/curriculum";

// "Before you start" - pinned at the top of the Challenge tab. Open on
// days 1-2, collapsed to a one-line summary after. The welcome video
// plus the four setup non-negotiables.
export default function ChallengeStart({ challengeDay = 1 }) {
  const welcome = getLesson("start-here");
  const open = challengeDay <= 2;

  return (
    <details
      open={open}
      className="challenge-start group relative overflow-hidden rounded-card border border-accent/30 [&_summary::-webkit-details-marker]:hidden"
    >
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
        <LoomEmbed id={welcome?.loomId} title="Start here: how the 14 days work" />

        <ol className="flex flex-col gap-3.5">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black tabular-nums">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-fg">{s.title}</span>
                <span className="text-xs leading-relaxed text-muted">{s.detail}</span>
              </span>
            </li>
          ))}
        </ol>
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
