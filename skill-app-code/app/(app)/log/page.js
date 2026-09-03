import { getExercises } from "@/lib/data/exercises";
import { getDayTemplateExercises, getDayTemplate } from "@/lib/data/dayTemplates";
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

  const allExercises = await getExercises();
  const byId = new Map(allExercises.map((e) => [e.id, e]));

  let title = "Workout";
  let preload = [];

  if (dayTemplateId && variant) {
    const [day, items] = await Promise.all([
      getDayTemplate(dayTemplateId),
      getDayTemplateExercises(dayTemplateId, variant),
    ]);
    if (day) title = variant === "Standard" ? day.name : `${day.name} (${variant})`;
    preload = items
      .filter((it) => it.exercise)
      .map((it) => ({ exercise: it.exercise, sets: it.sets, reps: it.reps }));
  } else if (exerciseId && byId.has(exerciseId)) {
    const e = byId.get(exerciseId);
    title = e.name;
    preload = [{ exercise: e, sets: 3, reps: "" }];
  }

  return (
    <WorkoutLogger
      allExercises={allExercises}
      initial={{ title, exercises: preload, splitId, dayTemplateId, variant }}
    />
  );
}

function strOrNull(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
