"use server";

import { getExerciseHistory } from "@/lib/data/exerciseHistory";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg } from "@/lib/units";

// Lazy-loaded when the user taps the "last time" line in the logger.
// Returns the last few sessions for one exercise, weights already in the
// user's display unit.
export async function fetchExerciseHistory(exerciseId, limit = 5) {
  const [{ sessions, count }, unit] = await Promise.all([
    getExerciseHistory(exerciseId, { limit }),
    getUnitPreference(),
  ]);

  const conv = (kg) =>
    kg == null ? null : unit === "kg" ? kg : Math.round(fromKg(kg, unit) * 10) / 10;

  return {
    unit,
    count,
    sessions: sessions.map((s) => ({
      id: s.id,
      date: s.date.slice(0, 10),
      sets: s.sets
        .filter((x) => x.weight != null || x.reps != null)
        .map((x) => ({ weight: conv(x.weight), reps: x.reps, rir: x.rir })),
    })),
  };
}
