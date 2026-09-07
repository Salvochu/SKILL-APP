import { getActiveMesocycle, getMesocycleSummary } from "@/lib/data/mesocycles";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getBeginnerContext } from "@/lib/data/profile";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";

export default async function MesocycleSection() {
  const [active, workoutSummary, beginner] = await Promise.all([
    getActiveMesocycle(),
    getWorkoutSummary(),
    getBeginnerContext(),
  ]);
  const summary = active?.isComplete ? await getMesocycleSummary(active.id) : null;
  return (
    <MesocyclePanel
      active={active}
      summary={summary}
      isNew={workoutSummary.workouts === 0}
      isBeginner={beginner.isBeginner}
    />
  );
}
