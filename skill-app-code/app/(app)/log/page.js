import { getExercises } from "@/lib/data/exercises";
import { getDayTemplateExercises, getDayTemplate } from "@/lib/data/dayTemplates";
import { getMyWorkout } from "@/lib/data/myWorkouts";
import { getRecentPerformance } from "@/lib/data/history";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getNotificationPrefs } from "@/lib/data/notifications";
import { getUnitPreference, getBeginnerContext } from "@/lib/data/profile";
import { getChallengeAccess } from "@/lib/data/challenge";
import { setsForWeek } from "@/lib/mesocycle";
import { fromKg } from "@/lib/units";
import WorkoutLogger from "@/components/log/WorkoutLogger";
import ChallengeEnded from "@/components/challenge/ChallengeEnded";
import ChallengeProgramLocked from "@/components/challenge/ChallengeProgramLocked";

// The challenge runs on this split; a challenge account can log its days
// and its own saved workouts, but not other programs' sessions.
const CHALLENGE_SPLIT_ID = "main-character-14";

export const metadata = { title: "Log Workout" };

// Interactive form over request-time data (searchParams, the user's
// library). No useful static shell, so it opts out of instant validation.
export const instant = false;

export default async function LogPage({ searchParams }) {
  const challengeAccess = await getChallengeAccess();
  // A lapsed challenge account cannot start new workouts.
  if (challengeAccess.lapsed) {
    return <ChallengeEnded />;
  }

  const params = await searchParams;
  const splitId = strOrNull(params?.split);

  // An active challenge account can log its own challenge days and its
  // saved workouts, but another program's session is a paid feature.
  if (challengeAccess.isChallenge && splitId && splitId !== CHALLENGE_SPLIT_ID) {
    return <ChallengeProgramLocked />;
  }
  const dayTemplateId = strOrNull(params?.day);
  const variant = strOrNull(params?.variant);
  const exerciseId = strOrNull(params?.exercise);
  const mesoId = strOrNull(params?.meso);
  const myWorkoutId = strOrNull(params?.mine);

  const [allExercises, historyKg, activeMeso, prefs, unit, beginner, myWorkout] = await Promise.all([
    getExercises(),
    getRecentPerformance(),
    // Re-fetched fresh here rather than trusting the link's query params,
    // so a bookmarked or day-old link always reflects the real current
    // week, not whatever week it was when the link was made.
    mesoId ? getActiveMesocycle() : null,
    getNotificationPrefs(),
    getUnitPreference(),
    getBeginnerContext(),
    myWorkoutId ? getMyWorkout(myWorkoutId) : null,
  ]);
  // The logger works entirely in the user's chosen unit: history comes
  // in converted, and it converts back to kg on save.
  const history =
    unit === "kg"
      ? historyKg
      : Object.fromEntries(
          Object.entries(historyKg).map(([id, entry]) => [
            id,
            {
              ...entry,
              sets: entry.sets.map((s) => ({
                ...s,
                weight: s.weight == null ? null : Math.round(fromKg(s.weight, unit) * 10) / 10,
              })),
            },
          ]),
        );
  const byId = new Map(allExercises.map((e) => [e.id, e]));
  const meso = mesoId && activeMeso?.id === mesoId ? activeMeso : null;
  // Foundations and the 14-day challenge both keep a fixed prescription
  // every session and carry no week / deload framing on the log screen.
  const linearMeso = meso && (meso.kind === "foundations" || meso.kind === "challenge");

  let title = "Workout";
  let preload = [];

  if (dayTemplateId && variant) {
    const [day, items] = await Promise.all([
      getDayTemplate(dayTemplateId),
      getDayTemplateExercises(dayTemplateId, variant),
    ]);
    if (day) title = variant === "Standard" ? day.name : `${day.name} (${variant})`;
    if (meso && !linearMeso) {
      title = `${title} . Week ${meso.week} of ${meso.weeks}${meso.isDeload ? " (deload)" : ""}`;
    }

    // Foundations and the challenge keep a fixed prescription every
    // session; only a periodised mesocycle's deload week trims sets.
    const applyDeload = meso && !linearMeso;
    preload = items
      .filter((it) => it.exercise)
      .map((it) => ({
        exercise: it.exercise,
        sets: applyDeload ? setsForWeek(it.sets, meso.week, meso.weeks) : it.sets,
        reps: it.reps,
      }));
  } else if (myWorkout) {
    title = myWorkout.name;
    preload = myWorkout.exercises
      .filter((it) => it.exercise)
      .map((it) => ({ exercise: it.exercise, sets: it.sets, reps: it.reps }));
  } else if (exerciseId && byId.has(exerciseId)) {
    const e = byId.get(exerciseId);
    title = e.name;
    preload = [{ exercise: e, sets: 3, reps: "" }];
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <WorkoutLogger
      // Navigating from one /log?... to another (e.g. cancel a workout,
      // start a different one) keeps this route segment mounted, so
      // without a key the old form state, timer and draft would carry
      // over. Keying on the workout's identity forces a clean remount.
      key={`${splitId ?? ""}|${dayTemplateId ?? ""}|${variant ?? ""}|${exerciseId ?? ""}|${myWorkoutId ?? ""}|${today}`}
      allExercises={allExercises}
      history={history}
      unit={unit}
      restTimer={prefs.restTimerEnabled}
      inlineVideos={prefs.inlineVideos}
      advanced={beginner.advanced}
      mesoContext={
        meso
          ? {
              // The challenge behaves like Foundations on the log screen.
              kind: meso.kind === "challenge" ? "foundations" : meso.kind,
              week: meso.week,
              weeks: meso.weeks,
              isDeload: meso.isDeload,
              rirTarget: meso.rirTarget,
              guidance: meso.guidance ?? null,
            }
          : null
      }
      initial={{
        title,
        date: today,
        exercises: preload,
        splitId,
        dayTemplateId,
        variant,
        userMesocycleId: meso?.id ?? null,
        myWorkoutId: myWorkout?.id ?? null,
      }}
    />
  );
}

function strOrNull(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
