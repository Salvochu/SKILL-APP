import { notFound } from "next/navigation";
import { getExercises } from "@/lib/data/exercises";
import { getMyWorkout } from "@/lib/data/myWorkouts";
import WorkoutBuilder from "@/components/workouts/WorkoutBuilder";

export const metadata = { title: "Edit workout" };

// Per-user data behind a dynamic id, same reasoning as
// app/(app)/workouts/[id]/page.js.
export const instant = false;

export default async function EditMyWorkoutPage({ params }) {
  const { id } = await params;
  const [allExercises, workout] = await Promise.all([getExercises(), getMyWorkout(id)]);
  if (!workout) notFound();

  return (
    <WorkoutBuilder
      allExercises={allExercises}
      initial={{
        id: workout.id,
        name: workout.name,
        note: workout.note,
        exercises: workout.exercises,
      }}
    />
  );
}
