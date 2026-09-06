import { getActiveMesocycle, getMesocycleSummary } from "@/lib/data/mesocycles";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";

export default async function MesocycleSection() {
  const active = await getActiveMesocycle();
  const summary = active?.isComplete ? await getMesocycleSummary(active.id) : null;
  return <MesocyclePanel active={active} summary={summary} />;
}
