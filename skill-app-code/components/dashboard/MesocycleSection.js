import { getActiveMesocycle, getMesocycleSummary } from "@/lib/data/mesocycles";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getBeginnerContext, getUnitPreference } from "@/lib/data/profile";
import { getChallengeAccess, hasRunChallenge } from "@/lib/data/challenge";
import MesocyclePanel from "@/components/dashboard/MesocyclePanel";
import ChallengePrepCard from "@/components/dashboard/ChallengePrepCard";

export default async function MesocycleSection() {
  const [active, workoutSummary, beginner, access, challengeGraduate, unit] = await Promise.all([
    getActiveMesocycle(),
    getWorkoutSummary(),
    getBeginnerContext(),
    getChallengeAccess(),
    hasRunChallenge(),
    getUnitPreference(),
  ]);

  // Prep window: the challenge run exists but the clock is not running.
  // Show the "get set up and start" nudge instead of the program panel.
  if (access.isChallenge && !access.started) {
    return <ChallengePrepCard />;
  }

  const summary = active?.isComplete ? await getMesocycleSummary(active.id) : null;
  return (
    <MesocyclePanel
      active={active}
      summary={summary}
      isNew={workoutSummary.workouts === 0}
      isBeginner={beginner.isBeginner}
      challengeLapsed={access.lapsed}
      hasChallengeHistory={challengeGraduate}
      unit={unit}
    />
  );
}
