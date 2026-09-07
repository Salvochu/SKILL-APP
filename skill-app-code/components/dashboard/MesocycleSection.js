import { getActiveMesocycle, getMesocycleSummary } from "@/lib/data/mesocycles";
import { getWorkoutSummary } from "@/lib/data/workouts";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";

export default async function MesocycleSection() {
  const [active, workoutSummary] = await Promise.all([
    getActiveMesocycle(),
    getWorkoutSummary(),
  ]);
  const summary = active?.isComplete ? await getMesocycleSummary(active.id) : null;
  return (
    <MesocyclePanel active={active} summary={summary} isNew={workoutSummary.workouts === 0} />
  );
}
