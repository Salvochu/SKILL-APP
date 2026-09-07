"use server";

import { getExerciseHistory } from "@/lib/data/exerciseHistory";
import { fromKg } from "@/lib/units";

// Lazy-loaded when the user taps the "last time" line in the logger.
// Returns the last few sessions for one exercise, weights already in the
// user's display unit. The unit is passed in from the logger (which
// already knows it) rather than looked up here - that lookup does a
// network round-trip to the auth server on top of the one proxy.js
// already does, which was making this popup take seconds to open.
export async function fetchExerciseHistory(exerciseId, limit = 5, unit = "kg") {
  const { sessions, count } = await getExerciseHistory(exerciseId, { limit });

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
