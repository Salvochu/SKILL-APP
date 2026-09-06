// Pure helpers for exercise data. No server-only imports: safe in both
// Server and Client Components.

// Muscle groups, in the order the library and pickers show them.
export const MUSCLE_ORDER = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

// The specific muscles under each parent group, in display order. Mirrors
// the `muscles` table (migration 0017). One source of truth: the taxonomy
// maps and the volume model both read this list.
export const MUSCLE_LIST = [
  { id: "upper_chest", name: "Upper chest", parent: "Chest" },
  { id: "mid_chest", name: "Mid / lower chest", parent: "Chest" },
  { id: "lats", name: "Lats", parent: "Back" },
  { id: "upper_traps", name: "Upper traps", parent: "Back" },
  { id: "mid_back", name: "Mid-back (rhomboids)", parent: "Back" },
  { id: "lower_back", name: "Lower back (spinal erectors)", parent: "Back" },
  { id: "front_delt", name: "Front delt", parent: "Shoulders" },
  { id: "side_delt", name: "Side delt", parent: "Shoulders" },
  { id: "rear_delt", name: "Rear delt", parent: "Shoulders" },
  { id: "biceps", name: "Biceps", parent: "Arms" },
  { id: "triceps", name: "Triceps", parent: "Arms" },
  { id: "forearms", name: "Forearms", parent: "Arms" },
  { id: "quads", name: "Quads", parent: "Legs" },
  { id: "hamstrings", name: "Hamstrings", parent: "Legs" },
  { id: "glutes", name: "Glutes", parent: "Legs" },
  { id: "calves", name: "Calves", parent: "Legs" },
  { id: "adductors", name: "Adductors", parent: "Legs" },
  { id: "abductors", name: "Abductors", parent: "Legs" },
  { id: "hip_flexors", name: "Hip flexors", parent: "Legs" },
  { id: "abs", name: "Abs", parent: "Core" },
  { id: "obliques", name: "Obliques", parent: "Core" },
];

// sub-muscle display name -> parent group name
export const SUB_MUSCLE_PARENT = Object.fromEntries(
  MUSCLE_LIST.map((m) => [m.name, m.parent]),
);

// The sub-muscles of a parent group, in display order.
export function musclesInGroup(parent) {
  return MUSCLE_LIST.filter((m) => m.parent === parent);
}

// Resolves any muscle name (parent group or specific muscle) to its parent
// group name.
export function muscleParent(muscle) {
  const raw = String(muscle || "");
  return SUB_MUSCLE_PARENT[raw] || raw;
}

// Maps a muscle name (parent group or specific muscle) to its CSS
// custom-property suffix (--muscle-<key>). Specific muscles take the
// colour of their parent group.
export function muscleKey(muscle) {
  const k = muscleParent(muscle).toLowerCase();
  return MUSCLE_ORDER.map((m) => m.toLowerCase()).includes(k) ? k : "core";
}

// Equipment, in filter order.
export const EQUIPMENT_ORDER = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"];

// Day template variants (the equipment choice for a split's days), in
// display order. "Standard" covers single-variant days like the coached
// programs, which have no real equipment choice to make.
export const VARIANT_ORDER = ["Full Gym", "Dumbbells", "Bodyweight", "Standard"];

function orderedBy(order, values) {
  const known = order.filter((v) => values.includes(v));
  const extra = values.filter((v) => !order.includes(v)).sort((a, b) => a.localeCompare(b));
  return [...known, ...extra];
}
export const sortMuscles = (v) => orderedBy(MUSCLE_ORDER, v);
export const sortEquipment = (v) => orderedBy(EQUIPMENT_ORDER, v);
export const sortVariants = (v) => orderedBy(VARIANT_ORDER, v);

// Turn a Loom share URL into its embed URL. Returns null for anything that
// is not a recognised Loom share link (or a missing video).
export function loomEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const match = videoUrl.match(/loom\.com\/(?:share|embed)\/([0-9a-f]{16,})/i);
  return match ? `https://www.loom.com/embed/${match[1]}` : null;
}
