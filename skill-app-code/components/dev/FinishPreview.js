"use client";

import { useEffect, useState } from "react";
import { WorkoutSummary } from "@/components/log/WorkoutLogger";
import { buildShareImageBlob } from "@/lib/shareCard";
import { buildProgressShareBlob } from "@/lib/progressShare";
import { buildClimbShareBlob } from "@/lib/climbShare";
import { buildPhotoCompareBlob } from "@/lib/photoShare";

const MUSCLES = {
  top: [
    { group: "Back", parent: "Back", sets: 9 },
    { group: "Biceps", parent: "Arms", sets: 5 },
    { group: "Shoulders", parent: "Shoulders", sets: 3 },
  ],
  totalSets: 17,
};
const JOURNEY = {
  xpGained: 42,
  level: 9,
  tier: "Steel",
  tierColor: "#9aa3ad",
  pctToNextLevel: 28,
  xpToNextLevel: 58,
  leveledUp: false,
  rankedUp: false,
};
const SAVE = {
  defaultName: "Back & Pull",
  exercises: [{ exerciseId: "x", sets: 3, reps: "8-12" }],
  sourceMyWorkoutId: null,
  sourceName: "Back & Pull",
  modified: false,
};

const STATES = {
  first: {
    label: "First workout",
    summary: { sessionId: "a", date: "2026-11-01", title: "Day A (Full Gym)", durationMin: 38, totalVolume: 2140, totalSets: 12 },
    extras: { workoutCount: 1, newPRs: [], strength: null, journey: { ...JOURNEY, level: 1, tier: "Steel" }, muscles: MUSCLES },
  },
  regular: {
    label: "Regular, with PRs",
    summary: { sessionId: "b", date: "2026-11-01", title: "Back & Pull", durationMin: 64, totalVolume: 8650, totalSets: 17 },
    extras: {
      workoutCount: 52,
      newPRs: [
        { name: "Lat Pulldown", weight: 85, reps: 6, e1rm: 102 },
        { name: "Chest Supported Landmine Row", weight: 55, reps: 10, e1rm: 73 },
      ],
      strength: null,
      journey: JOURNEY,
      muscles: MUSCLES,
    },
  },
  levelup: {
    label: "Level up",
    summary: { sessionId: "c", date: "2026-11-01", title: "Push Day (Full Gym)", durationMin: 51, totalVolume: 6120, totalSets: 15 },
    extras: { workoutCount: 53, newPRs: [], strength: null, journey: { ...JOURNEY, level: 10, leveledUp: true, pctToNextLevel: 6 }, muscles: MUSCLES },
  },
  rankup: {
    label: "Rank up",
    summary: { sessionId: "d", date: "2026-11-01", title: "Legs Day", durationMin: 47, totalVolume: 5900, totalSets: 14 },
    extras: {
      workoutCount: 90,
      newPRs: [],
      strength: null,
      journey: { ...JOURNEY, level: 15, tier: "Bronze", tierColor: "#c07a3e", leveledUp: true, rankedUp: true, pctToNextLevel: 3 },
      muscles: MUSCLES,
    },
  },
};

export default function FinishPreview() {
  const [which, setWhich] = useState("regular");
  const [images, setImages] = useState({});

  useEffect(() => {
    let cancelled = false;
    // Each image on its own, so one failing does not hide the others.
    const jobs = {
      workout: () =>
        buildShareImageBlob({
          volumeLabel: "8,650 kg",
          timeLabel: "1h 4m",
          effortLabel: "Hard",
          topMuscles: MUSCLES.top,
          totalSets: MUSCLES.totalSets,
        }),
      workoutPlain: () => buildShareImageBlob({ volumeLabel: "2,140 kg", timeLabel: "38m", effortLabel: null }),
      progress: () =>
        buildProgressShareBlob({
          levelLabel: "Level 9",
          tierLabel: "Steel",
          tierColor: "#9aa3ad",
          xpPct: 28,
          stats: [
            ["Workouts", "52"],
            ["kg lifted", "126k"],
            ["Trained", "8h"],
          ],
          muscles: [
            { name: "Legs", sets: 148, parent: "Legs" },
            { name: "Back", sets: 121, parent: "Back" },
            { name: "Chest", sets: 96, parent: "Chest" },
            { name: "Shoulders", sets: 74, parent: "Shoulders" },
          ],
        }),
      climb: () => buildClimbShareBlob({ day: 6, totalDays: 14, streak: 4 }),
      climbDone: () => buildClimbShareBlob({ day: 14, totalDays: 14, streak: 14, headline: "Challenge complete." }),
      // Same-origin files: the CSP blocks fetching data: URLs, and real
      // photos come from Supabase, which it allows.
      photos: () =>
        buildPhotoCompareBlob({
          beforeUrl: "/onboarding/add-to-home-ios.jpg",
          afterUrl: "/onboarding/add-to-home-android.jpg",
          beforeLabel: "4 Sep",
          afterLabel: "1 Nov",
          deltaLines: ["8 weeks", "-4.2 kg"],
        }),
    };
    (async () => {
      const out = {};
      for (const [k, job] of Object.entries(jobs)) {
        try {
          const blob = await job();
          if (blob) out[k] = URL.createObjectURL(blob);
        } catch (e) {
          console.error(k, e);
        }
      }
      if (!cancelled) setImages(out);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const st = STATES[which];
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            data-state={k}
            onClick={() => {
              setWhich(k);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${which === k ? "bg-fg text-bg" : "bg-surface-2 text-muted"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div id="summary">
        <WorkoutSummary
          key={which}
          summary={st.summary}
          extras={st.extras}
          effort={which === "first" ? null : 4}
          unit="kg"
          onDone={() => {}}
          saveAsWorkout={SAVE}
        />
      </div>

      <section id="shares" className="flex flex-col gap-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Share images</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(images).map(([k, u]) =>
            u ? (
              <figure key={k} className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={k} data-share={k} className="w-full rounded-xl border border-border" />
                <figcaption className="text-[12px] text-dim">{k}</figcaption>
              </figure>
            ) : null,
          )}
        </div>
      </section>
    </div>
  );
}
