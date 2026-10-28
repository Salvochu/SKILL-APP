// Shown while the Challenge tab loads today's day and checklist. The
// heading is real text (it never changes); the rest is the outline of the
// climb, today's card and the timeline.
export default function ChallengeLoading() {
  return (
    <div className="flex flex-col gap-6 py-2" aria-busy="true" aria-label="Loading challenge">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Your challenge</h1>
        <p className="text-sm text-muted">14 days. Show up every one of them.</p>
      </header>
      <div className="h-40 w-full rounded-card skeleton bg-surface-2" />
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <div className="h-4 w-24 rounded skeleton bg-surface-2" />
        <div className="h-6 w-3/4 rounded skeleton bg-surface-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-full rounded-field skeleton bg-surface-2" />
        ))}
      </div>
      <div className="h-56 w-full rounded-card skeleton bg-surface-2" />
    </div>
  );
}
