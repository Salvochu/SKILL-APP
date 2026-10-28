import { redirect, notFound } from "next/navigation";
import { getIsCoach, getClientChallenge } from "@/lib/data/coach";
import { getUnitPreference } from "@/lib/data/profile";
import ClientChallengeView from "@/components/coach/ClientChallengeView";

export const metadata = { title: "Client challenge" };
export const instant = false;

export default async function ClientChallengePage({ params }) {
  if (!(await getIsCoach())) redirect("/dashboard");
  const { id } = await params;
  const [data, unit] = await Promise.all([getClientChallenge(id), getUnitPreference()]);
  if (!data) notFound();
  return <ClientChallengeView clientId={id} data={data} unit={unit} />;
}
