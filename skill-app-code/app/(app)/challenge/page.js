import { redirect } from "next/navigation";
import { getMembership, getUnitPreference } from "@/lib/data/profile";
import { getChallengeAccess, getChallengeChecklist, getChallengeCompletion } from "@/lib/data/challenge";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getChallengeDay, CHALLENGE_DAYS } from "@/lib/challenge/curriculum";
import { fromKg } from "@/lib/units";
import ChallengeClimb from "@/components/challenge/ChallengeClimb";
import ChallengePrep from "@/components/challenge/ChallengePrep";
import ChallengeStart from "@/components/challenge/ChallengeStart";
import ChallengeToday from "@/components/challenge/ChallengeToday";
import ChallengeTimeline from "@/components/challenge/ChallengeTimeline";
import ChallengeLearn from "@/components/challenge/ChallengeLearn";
import ChallengeComplete from "@/components/challenge/ChallengeComplete";
import ChallengeEnded from "@/components/challenge/ChallengeEnded";

export const metadata = { title: "Challenge" };

// Depends on request-time data (the current day, the user's checklist).
export const instant = false;

export default async function ChallengePage() {
  const membership = await getMembership();
  if (membership !== "challenge") redirect("/dashboard");

  const access = await getChallengeAccess();
  if (!access.started) return <ChallengePrep startByLabel={access.startByLabel} />;
  if (access.lapsed) return <ChallengeEnded />;

  const [checklist, meso, completion, unit] = await Promise.all([
    getChallengeChecklist(),
    getActiveMesocycle(),
    getChallengeCompletion(),
    getUnitPreference(),
  ]);

  const total = CHALLENGE_DAYS.length;
  const challengeDay = Math.min(Math.max(access.challengeDay ?? 1, 1), total);
  const today = getChallengeDay(challengeDay);
  const variant = meso?.variant && meso.variant !== "Standard" ? meso.variant : "Full Gym";

  const volDisplay = Math.round(fromKg(completion.volumeKg, unit));
  const volumeLabel = `${volDisplay.toLocaleString("en-GB")} ${unit}`;

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Your challenge</h1>
        <p className="text-sm text-muted">14 days. Show up every one of them.</p>
      </header>

      <ChallengeClimb
        day={challengeDay}
        totalDays={total}
        completeDays={checklist.completeDays}
        streak={checklist.streak}
      />

      <ChallengeStart challengeDay={challengeDay} />

      {completion.completed ? (
        <ChallengeComplete
          sessions={completion.sessions}
          targetSessions={completion.targetSessions}
          perfectDays={completion.perfectDays}
          volumeLabel={volumeLabel}
          topMuscles={completion.muscles.top}
        />
      ) : null}

      <ChallengeToday
        day={today}
        challengeDay={challengeDay}
        mesoId={meso?.id ?? null}
        variant={variant}
        items={checklist.byDay[challengeDay] ?? {}}
      />

      <ChallengeTimeline challengeDay={challengeDay} byDay={checklist.byDay} />

      <ChallengeLearn />
    </div>
  );
}
