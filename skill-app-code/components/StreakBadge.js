import Link from "next/link";
import { getWorkoutSummary } from "@/lib/data/workouts";

// Small streak chip in the top bar. Orange when a streak is running,
// faded when it is not. Links to the dashboard.
export default async function StreakBadge() {
  const s = await getWorkoutSummary();
  const n = s.streakWeeks ?? 0;
  const active = n > 0;

  return (
    <Link
      href="/dashboard"
      aria-label={active ? `${n} week streak` : "No current streak"}
      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-colors ${
        active ? "bg-accent text-black" : "bg-surface-2 text-dim hover:text-fg"
      }`}
    >
      <IconFlame className="h-3.5 w-3.5" />
      <span className="tabular">{n}</span>
    </Link>
  );
}

function IconFlame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c1 3-1 5-1 7a3 3 0 0 0 6 0c0-1 0-2-.5-3 2 2 3.5 4.5 3.5 7a8 8 0 0 1-16 0c0-4 3-6 4-9 .7-2 3-2 4-2z" />
    </svg>
  );
}
