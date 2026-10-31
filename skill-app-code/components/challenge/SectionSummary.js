// The tappable header row of a collapsible card on the Challenge tab
// ("The 14 days", "Learn"): icon tile, title, one line of detail, and a
// chevron that turns when open. Matches the "Before you start" card.
// Goes inside a <details className="group ..."> as its <summary>.
export default function SectionSummary({ icon, title, detail }) {
  return (
    <summary className="flex cursor-pointer list-none items-center gap-3.5 rounded-2xl p-4 transition-colors active:bg-surface-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{title}</span>
        {detail ? <span className="truncate text-[14px] text-muted">{detail}</span> : null}
      </span>
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </summary>
  );
}
