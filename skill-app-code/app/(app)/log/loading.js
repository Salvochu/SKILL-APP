// Shown the instant someone taps into a workout, while the plan, their
// last numbers and the exercise library load: the shape of the logger,
// so it reads as "nearly there" instead of a blank screen or a spinner.
export default function LogLoading() {
  return (
    <div className="flex flex-col gap-4 py-2" aria-busy="true" aria-label="Loading workout">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded skeleton bg-surface-2" />
        <div className="h-4 w-32 rounded skeleton bg-surface-2" />
      </div>
      <div className="h-12 w-full rounded-card skeleton bg-surface-2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-field skeleton bg-surface-2" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 rounded skeleton bg-surface-2" />
              <div className="h-3 w-1/3 rounded skeleton bg-surface-2" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((__, j) => (
            <div key={j} className="h-9 w-full rounded-field skeleton bg-surface-2" />
          ))}
        </div>
      ))}
    </div>
  );
}
