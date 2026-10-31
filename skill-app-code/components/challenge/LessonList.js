"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import TapLink from "@/components/TapLink";
import LoomEmbed from "@/components/challenge/LoomEmbed";

// The Learn lessons as a compact list. Tapping one plays it in a
// slide-up sheet, so the section stays short instead of stacking a big
// player per lesson. `lessons` items: { slug, title, blurb, loomId,
// orientation, kind, locked, lockedLabel, note }. The "vsl" lesson (the
// what-happens-after-14-days pitch) is warmer, opens on its poster
// rather than auto-playing, and only shows its 1:1 link once played -
// showing it up front reads as a sales pitch before they've heard it.
export default function LessonList({ lessons }) {
  const [open, setOpen] = useState(null);

  return (
    <>
      <ul className="flex flex-col border-t border-border/70 [&>li:first-child_.lesson-sep]:border-transparent">
        {lessons.map((lesson) => {
          const vsl = lesson.kind === "vsl";
          const body = (
            <>
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  lesson.locked
                    ? "bg-fg/[0.06] text-dim"
                    : vsl
                      ? "bg-accent text-black shadow-[0_8px_20px_-10px_rgba(252,118,5,0.8)]"
                      : "bg-accent-soft text-accent"
                }`}
              >
                {lesson.locked ? <IconLock className="h-[18px] w-[18px]" /> : <IconPlay className="ml-0.5 h-5 w-5" />}
              </span>
              <span className="lesson-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {vsl && !lesson.locked ? (
                    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-accent">Watch on day 14</span>
                  ) : null}
                  <span className={`text-[16px] font-semibold leading-snug ${lesson.locked ? "text-muted" : "text-fg"}`}>
                    {lesson.title}
                  </span>
                  <span className="line-clamp-2 text-[13px] leading-snug text-dim">
                    {lesson.locked ? lesson.lockedLabel : lesson.blurb}
                  </span>
                </span>
                {lesson.locked ? null : <IconChevron className="h-4 w-4 shrink-0 text-dim" />}
              </span>
            </>
          );

          return (
            <li key={lesson.slug}>
              {lesson.locked ? (
                <div className="flex items-center gap-3 pl-4">{body}</div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(lesson)}
                  className="flex w-full items-center gap-3 pl-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {open ? <LessonSheet lesson={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function LessonSheet({ lesson, onClose }) {
  const vsl = lesson.kind === "vsl";
  const [played, setPlayed] = useState(!vsl);

  return (
    <Sheet onClose={onClose} ariaLabel={lesson.title}>
      {(close) => (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="font-display text-[1.4rem] font-bold leading-tight tracking-[-0.02em] text-fg">{lesson.title}</h2>
              <p className="text-[15px] leading-relaxed text-muted">{lesson.blurb}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/10 text-fg transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <LoomEmbed
            id={lesson.loomId}
            title={lesson.title}
            orientation={lesson.orientation}
            autoPlay={!vsl}
            onPlay={() => setPlayed(true)}
            loomLink
          />

          {lesson.note ? <p className="text-[13px] leading-snug text-dim">{lesson.note}</p> : null}

          {vsl && played ? (
            <div className="flex flex-col gap-2 pt-1">
              <TapLink
                href="/work-with-me"
                className="btn-shine flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
              >
                See how 1:1 coaching works
              </TapLink>
              <p className="text-center text-[13px] text-dim">No pressure. Finish your 14 days first.</p>
            </div>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
