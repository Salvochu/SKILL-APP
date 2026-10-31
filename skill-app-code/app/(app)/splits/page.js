import { Suspense } from "react";
import { getSplits } from "@/lib/data/splits";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getBeginnerContext } from "@/lib/data/profile";
import { getChallengeAccess, hasRunChallenge } from "@/lib/data/challenge";
import { getMyWorkouts } from "@/lib/data/myWorkouts";
import SplitsList from "@/components/splits/SplitsList";

export const metadata = { title: "Train" };

export default function SplitsPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Train</h1>
        <p className="text-[15px] text-muted">Start a session or pick a program.</p>
      </header>

      <Suspense fallback={<SplitsSkeleton />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const [splits, beginner, active, myWorkouts, challengeGraduate, access] = await Promise.all([
    getSplits(),
    getBeginnerContext(),
    getActiveMesocycle(),
    getMyWorkouts(),
    hasRunChallenge(),
    getChallengeAccess(),
  ]);

  const strengthCheck = beginner.showStrengthCheck
    ? splits.find((s) => s.id === "strength-check") ?? null
    : null;
  const browsable = splits.filter(
    (s) => s.section !== "benchmark" && s.section !== "foundations" && s.section !== "challenge",
  );
  // Only offer Foundations while a beginner has no program running -
  // starting it again would abandon the one in progress.
  const foundationsSplit = splits.find((s) => s.id === "foundations") ?? null;
  const foundations =
    beginner.isBeginner && !active && foundationsSplit ? foundationsSplit : null;

  return (
    <SplitsList
      upNext={upNextSession(active, access)}
      locked={access.isChallenge}
      splits={browsable}
      strengthCheck={strengthCheck}
      foundations={foundations}
      isBeginner={beginner.isBeginner}
      myWorkouts={myWorkouts}
      hasChallengeHistory={challengeGraduate}
    />
  );
}

// The program's next session, so Train opens on the one thing most
// people came here to do. Nothing while there is no next session to
// start: no program, a finished block, or a challenge not yet started,
// already over, or lapsed.
function upNextSession(active, access) {
  if (!active?.nextDay) return null;
  if (access.isChallenge && (!access.started || access.lapsed)) return null;
  const isChallenge = active.kind === "challenge";
  const linear = isChallenge || active.kind === "foundations";
  if (active.isComplete && !linear) return null;
  if (isChallenge && (active.isComplete || (active.challengeDay ?? 0) > (active.challengeDays ?? 14))) return null;

  const variant = active.variant && active.variant !== "Standard" ? active.variant : null;
  const where = isChallenge
    ? `Day ${active.challengeDay ?? 1} of ${active.challengeDays ?? 14}`
    : linear
      ? active.templateName
      : `${active.templateName} · Week ${active.week} of ${active.weeks}`;
  return {
    href: `/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`,
    title: active.nextDay.name,
    detail: [where, variant].filter(Boolean).join(" · "),
  };
}

function SplitsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[76px] w-full rounded-2xl skeleton bg-surface-2" />
      ))}
    </div>
  );
}
