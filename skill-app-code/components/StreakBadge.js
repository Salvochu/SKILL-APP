import { getWorkoutSummary } from "@/lib/data/workouts";
import StreakChip from "@/components/StreakChip";

// Server wrapper: reads the streak, hands it to the client chip.
export default async function StreakBadge() {
  const s = await getWorkoutSummary();
  return <StreakChip weeks={s.streakWeeks ?? 0} best={s.longestStreakWeeks ?? 0} />;
}
