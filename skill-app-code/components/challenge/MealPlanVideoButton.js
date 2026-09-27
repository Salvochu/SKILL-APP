"use client";

import { useState } from "react";
import LessonVideoModal from "@/components/challenge/LessonVideoModal";
import { getLesson } from "@/lib/challenge/curriculum";

// The "Watch: how to read your meal plan" setup step's action - a small
// icon on the right of the step's title (see SetupSteps.js) that opens
// the lesson in a popup, instead of a pill button underneath.
export default function MealPlanVideoButton() {
  const [open, setOpen] = useState(false);
  const lesson = getLesson("read-your-meal-plan");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Watch: how to read your meal plan"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-black"
      >
        <IconPlay className="ml-0.5 h-3.5 w-3.5" />
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

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
