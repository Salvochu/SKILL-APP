// Pure helpers for exercise data. No server-only imports: safe in both
// Server and Client Components.

// Muscle groups, in the order the library and pickers show them.
export const MUSCLE_ORDER = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

// The lifts a beginner should learn first (the Foundations movements).
// Surfaced as a shortlist at the top of the exercise library for anyone
// who picked "Beginner", matched to the library by exact name.
export const BEGINNER_STAPLE_NAMES = [
  "Back Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Lat Pulldown",
  "Goblet Squat",
  "DB Bench Press",
  "DB Row",
  "Plank",
];

// Isometric holds are timed, not loaded: you log seconds, not weight and
// reps. They must never feed the 1RM / personal-record maths (a "38 kg
// plank PR" is nonsense), and the logger shows them a Time field instead
// of Weight / Reps / RIR. Matched by name so a newly added hold is
// covered without a migration.
export function isTimeBasedExercise(name) {
  const n = String(name || "").toLowerCase();
  if (!n) return false;
  return (
    /\bplank\b/.test(n) ||
    /\bhold\b/.test(n) ||
    /\bdead ?hang\b/.test(n) ||
    /\bwall sit\b/.test(n) ||
    /\bl-?sit\b/.test(n) ||
    /\bhollow body\b/.test(n)
  );
}

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

// Groups shown broken into their specific muscles on the share cards
// (Legs -> Quads / Hamstrings / Glutes / ...; Arms -> Biceps / Triceps /
// Forearms). Chest, Back, Shoulders and Core stay single.
export const SPLIT_SHARE_PARENTS = new Set(["Legs", "Arms"]);

// The label to show for a muscle on a share card: the specific muscle
// for split groups, the group name otherwise. Trims the parenthetical
// on names like "Lower back (spinal erectors)" -> "Lower back".
export function muscleShareLabel(subName, parent) {
  if (!SPLIT_SHARE_PARENTS.has(parent)) return parent;
  const s = String(subName || "").replace(/\s*\(.*\)\s*$/, "").trim();
  return s || parent;
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

// Typo-tolerant exercise search. Returns a score (lower is better) or
// null for no match. Handles missing letters, transpositions and small
// misspellings so "benchpres", "sqaut" and "tricep" all land.
function normalizeSearch(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Damerau-Levenshtein (optimal string alignment). Names and query words
// are short, so the full matrix is cheap.
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 4) return 99;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

// Common gym shorthand, expanded on the query side so "db bench", "ohp"
// and "rdl" resolve to the full exercise names.
const SEARCH_ABBREV = {
  db: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  bw: "bodyweight",
  ohp: "overhead press",
  rdl: "romanian deadlift",
  sldl: "stiff leg deadlift",
  bss: "bulgarian split squat",
};

export function exerciseSearchScore(name, query) {
  const n = normalizeSearch(name);
  const q = normalizeSearch(query)
    .split(" ")
    .map((w) => SEARCH_ABBREV[w] ?? w)
    .join(" ");
  if (!q) return 0;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;

  // Whole string with spaces removed: catches concatenations and typos
  // where the user roughly typed the full name ("legpress", "benchpres",
  // "deadlfit", "hipthrust").
  const nj = n.replace(/ /g, "");
  const qj = q.replace(/ /g, "");
  if (nj === qj) return 0.5;
  if (nj.startsWith(qj)) return 1.5;
  if (nj.includes(qj)) return 2.5;
  if (qj.length >= 4 && Math.abs(nj.length - qj.length) <= 3) {
    const tol = qj.length <= 6 ? 1 : qj.length <= 10 ? 2 : 3;
    const dj = editDistance(nj, qj);
    if (dj <= tol) return 3 + dj;
  }

  const nWords = n.split(" ");
  const qWords = q.split(" ");
  let total = 0;
  for (const qw of qWords) {
    let best = Infinity;
    for (const nw of nWords) {
      if (nw === qw || nw.startsWith(qw)) {
        best = Math.min(best, 0.6);
      } else if (nw.includes(qw)) {
        best = Math.min(best, 1.5);
      } else if (qw.length >= 3) {
        const tol = qw.length <= 4 ? 1 : qw.length <= 7 ? 2 : 3;
        const dist = editDistance(nw, qw);
        if (dist <= tol) best = Math.min(best, 2 + dist);
      }
    }
    if (best === Infinity) return null;
    total += best;
  }
  return 5 + total;
}
