// Plain-language definitions for the training terms that show up in the
// UI. Kept short - a sentence or two someone new can act on. Surfaced by
// components/Explain.js as a tappable "?" next to the term. No imports,
// so it is safe on the client.

export const GLOSSARY = {
  rir: {
    term: "RIR - reps in reserve",
    body: "How many more reps you had left before failing. RIR 2 means you stopped with about 2 reps in the tank. On most working sets, aim to leave 1 to 3 in reserve - hard, but not to failure.",
  },
  warmup: {
    term: "Warm-up sets",
    body: "Lighter sets before your working weight to prepare the movement. Tap a set number in the logger to mark it a warm-up. Warm-ups do not count toward your training volume or your numbers.",
  },
  deload: {
    term: "Deload week",
    body: "The last week of a program, done with lighter weights and lower effort. It lets your body recover and absorb the training so you start the next block a little stronger.",
  },
  mesocycle: {
    term: "Mesocycle",
    body: "A training block, usually 4 to 6 weeks, where the effort builds week by week and ends with a deload. Then you start a fresh block, slightly stronger than last time.",
  },
  hardsets: {
    term: "Hard sets",
    body: "Sets taken close to failure, within roughly 3 reps. Counting these per muscle each week is a simple way to track training volume. 10 to 20 hard sets per muscle per week is a solid range for growth.",
  },
  e1rm: {
    term: "Estimated 1RM",
    body: "A prediction of the most you could lift once on an exercise, worked out from the weight and reps of your best set. It lets you compare sets that used different loads.",
  },
  strengthScore: {
    term: "Strength Score",
    body: "Your best estimated 1RM across six main movement patterns, added up. One number that goes up as you get stronger. The per-lift bars show where each one sits from Beginner to Elite.",
  },
  effort: {
    term: "How hard was this?",
    body: "A quick gut-check of how hard the whole session felt, from 1 (very easy) to 5 (very hard). Be honest - over time it shows whether your training is too easy, about right, or wearing you down.",
  },
};
