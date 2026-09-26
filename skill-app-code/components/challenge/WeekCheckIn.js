import ClimbShareButton from "@/components/challenge/ClimbShareButton";

// Shown only on Day 7 - a halfway milestone worth sharing, same climb
// card as Day 14's, just mid-trail instead of at the finish flag.
export default function WeekCheckIn({ totalDays, streak }) {
  return (
    <section className="flex flex-col items-center gap-2 overflow-hidden rounded-card border border-accent/40 bg-gradient-to-b from-accent-soft to-transparent px-5 py-6 text-center">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-fg">
        Halfway there
      </h2>
      <p className="text-sm text-muted">
        7 days down, 7 to go. Show them how far you have come.
      </p>
      <div className="w-full pt-2">
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
