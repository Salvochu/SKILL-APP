import { getActiveMesocycle, getMesocycleTemplates } from "@/lib/data/mesocycles";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";

export default async function MesocycleSection() {
  const [active, templates] = await Promise.all([getActiveMesocycle(), getMesocycleTemplates()]);
  return <MesocyclePanel active={active} templates={templates} />;
}
