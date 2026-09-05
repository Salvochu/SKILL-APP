import { needsOnboarding } from "@/lib/data/profile";
import OnboardingQuiz from "@/components/onboarding/OnboardingQuiz";

export default async function OnboardingGate() {
  const show = await needsOnboarding();
  if (!show) return null;
  return <OnboardingQuiz />;
}
