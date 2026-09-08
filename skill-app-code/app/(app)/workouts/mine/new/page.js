import { getExercises } from "@/lib/data/exercises";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";

export const metadata = { title: "Build a workout" };

// Interactive builder over the user's library; no useful static shell.
export const instant = false;

export default async function NewMyWorkoutPage() {
  const allExercises = await getExercises();
  return (
    <WorkoutBuilder
      allExercises={allExercises}
      initial={{ id: null, name: "", note: "", exercises: [] }}
    />
  );
}
