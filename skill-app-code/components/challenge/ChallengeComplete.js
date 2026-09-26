import ClimbShareButton from "@/components/challenge/ClimbShareButton";

// Shown on the Challenge tab once the 14-day plan is finished: the badge,
// the numbers, and a share button that renders the climb card as a PNG
// (the same visual as the hero at the top of the tab, not a separate
// stats-card design - see components/challenge/ClimbShareButton.js).
export default function ChallengeComplete({
  day,
  totalDays = 14,
  streak = 0,
  sessions = 0,
  targetSessions = 6,
  perfectDays = 0,
  volumeLabel = "0",
  topMuscles = [],
}) {
  return (
    <section className="overflow-hidden rounded-card border border-accent/40 bg-gradient-to-b from-accent-soft to-transparent">
      <div className="flex flex-col items-center gap-1 px-5 pt-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_30px_-4px_rgba(252,118,5,0.7)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-fg">
          Challenge complete
        </h2>
        <p className="text-sm text-muted">
          14 days done. That is more than most people manage. Here is what you put in.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 px-5">
        <Stat value={`${sessions}/${targetSessions}`} label="Sessions" />
        <Stat value={`${perfectDays}/14`} label="Perfect days" />
        <Stat value={volumeLabel} label="Volume" />
      </div>

      {topMuscles.length ? (
        <p className="mt-4 px-5 text-center text-xs font-semibold uppercase tracking-wider text-dim">
          Most trained: {topMuscles.slice(0, 3).map((m) => m.group ?? m).join(" · ")}
        </p>
      ) : null}

      <div className="p-5 pt-4">
        <ClimbShareButton
          day={day}
          totalDays={totalDays}
          streak={streak}
          headline="Challenge complete."
          caption={`14 days done. ${sessions} sessions, ${perfectDays}/14 perfect days with SKILL. @salvador_skfitness`}
          label="Share your result"
        />
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center rounded-field border border-border bg-surface/60 px-2 py-3 text-center">
      <span className="font-display text-lg font-bold text-fg tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</span>
    </div>
  );
}
