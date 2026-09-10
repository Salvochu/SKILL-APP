// App muscle ids that have an anatomy figure in /public/muscles (a grey
// full-body render with that muscle highlighted). Adductors, hip flexors
// and any non-tagged entry have no figure and fall back to the pills.
const MUSCLE_IMAGE_IDS = new Set([
  "biceps",
  "triceps",
  "forearms",
  "lats",
  "upper_traps",
  "mid_back",
  "lower_back",
  "upper_chest",
  "mid_chest",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abductors",
  "front_delt",
  "side_delt",
  "rear_delt",
]);

export function muscleImageSrc(muscleId) {
  return MUSCLE_IMAGE_IDS.has(muscleId) ? `/muscles/${muscleId}.webp` : null;
}

// The muscle to draw for an exercise: its first primary tag that has a
// figure, else its first tag with a figure.
export function figureMuscleFor(muscles = []) {
  return (
    muscles.find((m) => m.role === "primary" && muscleImageSrc(m.id)) ||
    muscles.find((m) => muscleImageSrc(m.id)) ||
    null
  );
}
