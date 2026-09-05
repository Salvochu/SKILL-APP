import {
  getActiveMesocycle,
  getMesocycleTemplates,
  getMesocycleSummary,
} from "@/lib/data/mesocycles";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";

export default async function MesocycleSection() {
  const [active, templates] = await Promise.all([getActiveMesocycle(), getMesocycleTemplates()]);
  const summary = active?.isComplete ? await getMesocycleSummary(active.id) : null;
  return <MesocyclePanel active={active} templates={templates} summary={summary} />;
}
