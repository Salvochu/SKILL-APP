// Pure helpers for exercise data. No server-only imports: safe in both
// Server and Client Components.

// Movement pattern categories, in the order the library and pickers show
// them. Anything not in this list is appended after, alphabetically, so a
// new category never silently disappears.
export const CATEGORY_ORDER = [
  "Push",
  "Pull",
  "Squat",
  "Hinge",
  "Shoulders",
  "Arms",
  "Core",
  "Calves",
];

export function sortCategories(categories) {
  const known = CATEGORY_ORDER.filter((c) => categories.includes(c));
  const extra = categories
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...extra];
}

// Turn a Loom share URL into its embed URL. Returns null for anything
// that is not a recognised Loom share link (or a missing video).
export function loomEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const match = videoUrl.match(/loom\.com\/(?:share|embed)\/([0-9a-f]{16,})/i);
  return match ? `https://www.loom.com/embed/${match[1]}` : null;
}
