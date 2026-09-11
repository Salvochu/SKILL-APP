import { needsOnboarding, getMembership, getProfile } from "@/lib/data/profile";
import OnboardingQuiz from "@/components/onboarding/OnboardingQuiz";
import ChallengeWelcome from "@/components/onboarding/ChallengeWelcome";

// Decides which first-run flow to show. Challenge sign-ups get a short
// challenge-specific welcome; everyone else gets the profile quiz. Each
// component decides whether to show itself and must not be unmounted by
// this gate once started (finishing marks onboarding complete, which
// re-runs this server component, and the handoff screen must stay up).
export default async function OnboardingGate() {
  const [show, membership, profile] = await Promise.all([
    needsOnboarding(),
    getMembership(),
    getProfile(),
  ]);
  const initialName = profile?.fullName ?? "";
  const initialAge = profile?.age ?? "";

  if (membership === "challenge") {
    return <ChallengeWelcome show={show} initialName={initialName} />;
  }
  // A convert-from-challenge account (or one GHL already sent a name and
  // age for, from the opt-in form) has these on file, so the quiz below
  // skips re-asking whichever it already has.
  return <OnboardingQuiz show={show} initialName={initialName} initialAge={initialAge} />;
}
