"use client";

import { useState } from "react";
import LessonVideoModal from "@/components/challenge/LessonVideoModal";
import { getLesson } from "@/lib/challenge/curriculum";

// The "Watch: how to read your meal plan" setup step's action - opens the
// lesson in a popup instead of embedding the player inline, so the setup
// list stays a list of steps rather than a list of videos.
export default function MealPlanVideoButton() {
  const [open, setOpen] = useState(false);
  const lesson = getLesson("read-your-meal-plan");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
      >
        <IconPlay className="h-3 w-3" />
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

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
