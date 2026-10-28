"use client";

import { useState } from "react";
import MusclePill from "@/components/MusclePill";
import ExerciseSheet from "@/components/library/ExerciseSheet";

// A shortlist of the lifts a beginner should learn first, pinned above
// the full library so 135 exercises are not the first thing they see.
// Laid out as a horizontal scroller so it stays one screen tall no
// matter how many staples there are. Tapping a card opens the same
// ExerciseSheet (video + how-to) as the main list below, not the
// history page - a brand new beginner has no history to show yet.
export default function BeginnerStaples({ exercises }) {
  const [openId, setOpenId] = useState(null);
  if (!exercises.length) return null;
  const open = exercises.find((e) => e.id === openId) ?? null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">Start here</span>
        <h2 className="font-sans text-[17px] font-semibold tracking-[-0.01em] text-fg">New to the gym? Start with these</h2>
        <p className="text-[14px] leading-snug text-muted">
          The core lifts from the Foundations program. Get comfortable here first.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-2.5">
          {exercises.map((e) => (
            <li key={e.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setOpenId(e.id)}
                className="flex h-full w-40 flex-col gap-2.5 rounded-2xl bg-surface p-3.5 text-left transition-[background-color,transform] hover:bg-surface-2 active:scale-[0.98]"
              >
                <span className="flex items-start justify-between gap-1">
                  <MusclePill muscle={e.muscle} />
                  {e.video_url ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <svg viewBox="0 0 24 24" className="ml-px h-3 w-3" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  ) : null}
                </span>
                <span className="text-[15px] font-semibold leading-snug text-fg">{e.name}</span>
                <span className="mt-auto text-[13px] text-dim">{e.equipment}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open ? <ExerciseSheet exercise={open} onClose={() => setOpenId(null)} /> : null}
    </section>
  );
}
