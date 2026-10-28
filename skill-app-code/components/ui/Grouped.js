// iOS-style inset grouped list, the one surface for forms and settings:
// a small header above, one rounded group, rows split by hairlines that
// start after the label inset (never a box inside a box), and optional
// footnote text underneath.
export function Group({ title, footer, children, className = "" }) {
  return (
    <section className={`flex flex-col gap-2 ${className}`}>
      {title ? (
        <h2 className="px-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{title}</h2>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-surface [&>*+*]:border-t [&>*+*]:border-border/70">
        {children}
      </div>
      {footer ? <p className="px-4 text-[13px] leading-snug text-dim">{footer}</p> : null}
    </section>
  );
}

// A label on the left, its control or value on the right.
export function Row({ label, htmlFor, children, className = "" }) {
  return (
    <div className={`flex min-h-[50px] items-center gap-3 px-4 ${className}`}>
      <label htmlFor={htmlFor} className="shrink-0 text-[16px] text-fg">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 items-center justify-end">{children}</div>
    </div>
  );
}

// Borderless control styles for inside a Row: right-aligned, muted value
// colour, the accent only on focus.
export const rowInput =
  "w-full min-w-0 bg-transparent py-3 text-right text-[16px] text-muted outline-none placeholder:text-dim focus:text-fg";
export const rowSelect =
  "w-full min-w-0 cursor-pointer appearance-none bg-transparent py-3 pr-5 text-right text-[16px] text-muted outline-none focus:text-fg";

// The little up/down chevron iOS puts after a picker value.
export function PickerChevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute right-0 h-4 w-4 text-dim" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 9 4-4 4 4M16 15l-4 4-4-4" />
    </svg>
  );
}

// A tappable full-width row (navigation or action), with an optional
// trailing chevron.
export const rowButton =
  "flex min-h-[50px] w-full items-center justify-between gap-3 px-4 text-left text-[16px] transition-colors active:bg-surface-2";
