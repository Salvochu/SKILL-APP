// Program sessions are saved with their week in the title, as
// "Push Day (Full Gym) . Week 2 of 5" (and older ones "Workout"). For
// display that splits into the session's name and, separately, the week,
// so a list shows "Push Day (Full Gym)" with "Week 2 of 5" beside it
// rather than a stray dot in the middle of the name.
export function splitWorkoutTitle(raw) {
  const title = String(raw ?? "").trim() || "Workout";
  const m = title.match(/^(.*?)\s*[.·]\s*(Week \d+ of \d+.*)$/);
  if (!m) return { name: title, week: null };
  return { name: m[1].trim() || "Workout", week: m[2].trim() };
}

// One line: "Push Day (Full Gym) · Week 2 of 5".
export function workoutTitleLine(raw) {
  const { name, week } = splitWorkoutTitle(raw);
  return week ? `${name} · ${week}` : name;
}
