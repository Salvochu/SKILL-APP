import ClimbShareButton from "@/components/challenge/ClimbShareButton";

// Shown only on Day 7 - a halfway milestone worth sharing, same climb
// card as Day 14's, just mid-trail instead of at the finish flag.
export default function WeekCheckIn({ totalDays, streak }) {
  return (
    <section className="relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <span className="relative text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">Day 7</span>
      <h2 className="relative font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
        Halfway there
      </h2>
      <p className="relative text-[15px] leading-relaxed text-muted">
        7 days down, 7 to go. Show them how far you have come.
      </p>
      <div className="relative w-full pt-3">
        <ClimbShareButton
          day={7}
          totalDays={totalDays}
          streak={streak}
          headline="Halfway there."
          caption="7 days down, 7 to go with SKILL. @salvador_skfitness"
          label="Share your progress"
        />
      </div>
    </section>
  );
}
