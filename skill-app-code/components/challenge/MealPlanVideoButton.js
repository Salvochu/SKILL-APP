"use client";

import { useState } from "react";
import LessonVideoModal from "@/components/challenge/LessonVideoModal";
import { getLesson } from "@/lib/challenge/curriculum";

// The "Watch: how to read your meal plan" setup step's action - opens the
// lesson in a popup instead of embedding the player inline, so the setup
// list stays a list of steps rather than a list of videos. The play icon
// lives next to the step's title instead (see SetupSteps.js), so this
// stays a plain text pill.
export default function MealPlanVideoButton() {
  const [open, setOpen] = useState(false);
  const lesson = getLesson("read-your-meal-plan");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex w-fit items-center rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
      >
        Watch video
      </button>
      {open ? (
        <LessonVideoModal
          loomId={lesson?.loomId}
          title={lesson?.title ?? "How to read your meal plan"}
          orientation="horizontal"
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
