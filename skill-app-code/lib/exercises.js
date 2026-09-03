// Pure helpers for exercise data. No server-only imports: safe in both
// Server and Client Components.

// Muscle groups, in the order the library and pickers show them.
export const MUSCLE_ORDER = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

// Equipment, in filter order.
export const EQUIPMENT_ORDER = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"];

function orderedBy(order, values) {
  const known = order.filter((v) => values.includes(v));
  const extra = values.filter((v) => !order.includes(v)).sort((a, b) => a.localeCompare(b));
  return [...known, ...extra];
}
export const sortMuscles = (v) => orderedBy(MUSCLE_ORDER, v);
export const sortEquipment = (v) => orderedBy(EQUIPMENT_ORDER, v);

// Turn a Loom share URL into its embed URL. Returns null for anything that
// is not a recognised Loom share link (or a missing video).
export function loomEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const match = videoUrl.match(/loom\.com\/(?:share|embed)\/([0-9a-f]{16,})/i);
  return match ? `https://www.loom.com/embed/${match[1]}` : null;
}
