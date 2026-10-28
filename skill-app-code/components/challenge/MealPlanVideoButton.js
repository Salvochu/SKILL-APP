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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-[background-color,color,transform] hover:bg-accent hover:text-black active:scale-90"
      >
        <IconPlay className="ml-0.5 h-4 w-4" />
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
