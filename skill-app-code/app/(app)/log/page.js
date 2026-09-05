import { getExercises } from "@/lib/data/exercises";
import { getDayTemplateExercises, getDayTemplate } from "@/lib/data/dayTemplates";
import { getRecentPerformance } from "@/lib/data/history";
import { getActiveMesocycle } from "@/lib/data/mesocycles";
import { getUnitPreference } from "@/lib/data/profile";
import { setsForWeek } from "@/lib/mesocycle";
import { fromKg } from "@/lib/units";
import WorkoutLogger from "@/components/log/WorkoutLogger";

export const metadata = { title: "Log Workout" };

// Interactive form over request-time data (searchParams, the user's
// library). No useful static shell, so it opts out of instant validation.
export const instant = false;

export default async function LogPage({ searchParams }) {
  const params = await searchParams;
  const splitId = strOrNull(params?.split);
  const dayTemplateId = strOrNull(params?.day);
  const variant = strOrNull(params?.variant);
  const exerciseId = strOrNull(params?.exercise);
  const mesoId = strOrNull(params?.meso);

  const [allExercises, historyKg, activeMeso, unit] = await Promise.all([
    getExercises(),
    getRecentPerformance(),
    // Re-fetched fresh here rather than trusting the link's query params,
    // so a bookmarked or day-old link always reflects the real current
    // week, not whatever week it was when the link was made.
    mesoId ? getActiveMesocycle() : null,
    getUnitPreference(),
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

  let title = "Workout";
  let preload = [];

  if (dayTemplateId && variant) {
    const [day, items] = await Promise.all([
      getDayTemplate(dayTemplateId),
      getDayTemplateExercises(dayTemplateId, variant),
    ]);
    if (day) title = variant === "Standard" ? day.name : `${day.name} (${variant})`;
    if (meso) title = `${title} . Week ${meso.week} of ${meso.weeks}${meso.isDeload ? " (deload)" : ""}`;

    preload = items
      .filter((it) => it.exercise)
      .map((it) => ({
        exercise: it.exercise,
        sets: meso ? setsForWeek(it.sets, meso.week, meso.weeks) : it.sets,
        reps: it.reps,
      }));
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
      key={`${splitId ?? ""}|${dayTemplateId ?? ""}|${variant ?? ""}|${exerciseId ?? ""}|${today}`}
      allExercises={allExercises}
      history={history}
      unit={unit}
      mesoContext={
        meso ? { week: meso.week, weeks: meso.weeks, isDeload: meso.isDeload, rirTarget: meso.rirTarget } : null
      }
      initial={{
        title,
        date: today,
        exercises: preload,
        splitId,
        dayTemplateId,
        variant,
        userMesocycleId: meso?.id ?? null,
      }}
    />
  );
}

function strOrNull(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
