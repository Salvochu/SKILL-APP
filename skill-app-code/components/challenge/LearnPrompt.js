"use client";

// A day-1-only nudge toward the Learn section (collapsed by default,
// further down the same page), for anyone who scrolled past it. Opens
// the <details id="learn"> in ChallengeLearn.js and scrolls to it - same
// getElementById + no-hash-navigation approach as BackToTop.js, so it
// can't trip the same standalone-PWA reload issue.
export default function LearnPrompt() {
  function openLearn() {
    const el = document.getElementById("learn");
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={openLearn}
      className="flex w-full items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-surface-2"
    >
      <span>Check out the lessons in Learn</span>
      <IconDown className="h-4 w-4 shrink-0" />
    </button>
  );
}

function IconDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
