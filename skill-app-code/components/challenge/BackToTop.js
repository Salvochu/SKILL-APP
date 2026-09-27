"use client";

// Scrolls back to #top without an <a href="#top">. A plain hash anchor
// changes the URL, and on iOS when the app is installed to the home
// screen (standalone display mode), a same-page hash-only navigation can
// get treated as a real page load and reload the whole route - which is
// what was actually happening here, not the pull-to-refresh gesture the
// overscroll-behavior fix in globals.css targeted. scrollIntoView never
// touches the URL, so there's nothing for the standalone shell to
// "navigate" to.
export default function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })}
      className="inline-flex items-center gap-1.5 self-center rounded-full border border-accent/40 bg-accent-soft px-4 py-2 text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:bg-accent hover:text-black"
    >
      <IconUp className="h-3.5 w-3.5" />
      Back to top
    </button>
  );
}

function IconUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
