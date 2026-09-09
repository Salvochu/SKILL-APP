import { redirect, notFound } from "next/navigation";
import { getIsCoach, getClientChallenge } from "@/lib/data/coach";
import ClientChallengeView from "@/components/coach/ClientChallengeView";

export const metadata = { title: "Client challenge" };
export const instant = false;

export default async function ClientChallengePage({ params }) {
  if (!(await getIsCoach())) redirect("/dashboard");
  const { id } = await params;
  const data = await getClientChallenge(id);
  if (!data) notFound();
  return <ClientChallengeView clientId={id} data={data} />;
}
