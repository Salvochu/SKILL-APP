// Shown while the Challenge tab loads today's day and checklist. The
// heading is real text (it never changes); the rest is the outline of the
// climb, today's card and the timeline.
export default function ChallengeLoading() {
  return (
    <div className="flex flex-col gap-6 py-2" aria-busy="true" aria-label="Loading challenge">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Your challenge</h1>
        <p className="text-[15px] text-muted">14 days. Show up every one of them.</p>
      </header>
      <div className="h-[26rem] w-full rounded-2xl skeleton bg-surface-2" />
      <div className="h-[72px] w-full rounded-2xl skeleton bg-surface-2" />
      <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5">
        <div className="h-4 w-32 rounded-full skeleton bg-surface-2" />
        <div className="h-8 w-2/3 rounded-lg skeleton bg-surface-2" />
        <div className="h-4 w-full rounded-full skeleton bg-surface-2" />
        <div className="h-14 w-full rounded-2xl skeleton bg-surface-2" />
      </div>
      <div className="h-72 w-full rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}
