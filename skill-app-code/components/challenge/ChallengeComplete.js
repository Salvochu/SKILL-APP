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
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <div className="relative flex flex-col items-center gap-1.5 pt-1 text-center">
        <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_36px_-6px_rgba(252,118,5,0.8)]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
          Challenge complete
        </h2>
        <p className="text-[15px] leading-relaxed text-muted">
          14 days done. That is more than most people manage. Here is what you put in.
        </p>
      </div>

      <div className="relative grid grid-cols-3 [&>*+*]:border-l [&>*+*]:border-border/70">
        <Stat value={`${sessions}/${targetSessions}`} label="Sessions" />
        <Stat value={`${perfectDays}/14`} label="Perfect days" />
        <Stat value={volumeLabel} label="Volume" />
      </div>

      {topMuscles.length ? (
        <p className="relative text-center text-[13px] text-muted">
          Most trained: <span className="font-semibold text-fg">{topMuscles.slice(0, 3).map((m) => m.group ?? m).join(" · ")}</span>
        </p>
      ) : null}

      <div className="relative">
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
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-center">
      <span className="max-w-full truncate text-[20px] font-bold leading-tight tracking-[-0.01em] text-fg tabular-nums">{value}</span>
      <span className="text-[12px] font-medium text-muted">{label}</span>
    </div>
  );
}
