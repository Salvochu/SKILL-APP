import { needsOnboarding, getMembership, getProfile } from "@/lib/data/profile";
import OnboardingQuiz from "@/components/onboarding/OnboardingQuiz";
import ChallengeWelcome from "@/components/onboarding/ChallengeWelcome";

// Decides which first-run flow to show. Challenge sign-ups get a short
// challenge-specific welcome; everyone else gets the profile quiz. Each
// component decides whether to show itself and must not be unmounted by
// this gate once started (finishing marks onboarding complete, which
// re-runs this server component, and the handoff screen must stay up).
export default async function OnboardingGate() {
  const [show, membership] = await Promise.all([needsOnboarding(), getMembership()]);

  if (membership === "challenge") {
    const profile = await getProfile();
    return <ChallengeWelcome show={show} initialName={profile?.fullName ?? ""} />;
  }
  return <OnboardingQuiz show={show} />;
}
