// A card whose body folds away behind its title, so the Progress page
// reads as a short list of sections on open rather than a long scroll.
// Uncontrolled <details>: rendered once on the server, the viewer's
// toggling is plain DOM and sticks for the visit.
export default function CollapsibleCard({ title, aside = null, defaultOpen = false, children }) {
  return (
    <details
      open={defaultOpen}
      className="group/card flex flex-col rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-colors active:bg-surface-2">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{title}</span>
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-muted">
          {aside}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-dim transition-transform group-open/card:rotate-90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-5">{children}</div>
    </details>
  );
}
