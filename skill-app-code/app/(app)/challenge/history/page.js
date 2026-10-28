import { redirect } from "next/navigation";
import { getMembership, getUnitPreference } from "@/lib/data/profile";
import { getChallengeHistory } from "@/lib/data/challenge";
import ChallengeHistory from "@/components/challenge/ChallengeHistory";

export const metadata = { title: "Your challenge" };

// Depends on request-time data (the checklist, the session).
export const instant = false;

export default async function ChallengeHistoryPage() {
  // Someone still on the challenge tier has this at the live /challenge
  // tab already - this route is only the after-the-fact recap.
  if ((await getMembership()) === "challenge") redirect("/challenge");
  const [data, unit] = await Promise.all([getChallengeHistory(), getUnitPreference()]);
  if (!data.found) redirect("/dashboard");
  return <ChallengeHistory data={data} unit={unit} />;
}
