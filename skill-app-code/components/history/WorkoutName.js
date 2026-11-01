import { splitWorkoutTitle } from "@/lib/workoutTitle";

// A logged session's name in a list row, with its program week (if any)
// as a quiet second line instead of tacked onto the name.
export default function WorkoutName({ title }) {
  const { name, week } = splitWorkoutTitle(title);
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-[16px] text-fg">{name}</span>
      {week ? <span className="truncate text-[13px] text-dim">{week}</span> : null}
    </span>
  );
}
