export const metadata = { title: "Log Workout" };

// Placeholder. The full set-logging screen (workout name, per-exercise set
// tables, rest timer, notes, save) is built next.
export default function LogPage() {
  return (
    <div className="flex flex-col gap-4 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Log Workout</h1>
        <p className="text-sm text-muted">Add exercises, enter your sets, and save to your history.</p>
      </header>
      <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        The workout logger lands here next.
      </div>
    </div>
  );
}
