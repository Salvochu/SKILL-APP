import { needsOnboarding } from "@/lib/data/profile";
import OnboardingQuiz from "@/components/onboarding/OnboardingQuiz";

// Always renders the quiz component; it decides whether to show itself.
// (It must NOT be unmounted by this gate once started - finishing the
// quiz marks onboarding complete, which re-runs this server component,
// and the "you're all set" handoff screen still needs to be on screen.)
export default async function OnboardingGate() {
  const show = await needsOnboarding();
  return <OnboardingQuiz show={show} />;
}
