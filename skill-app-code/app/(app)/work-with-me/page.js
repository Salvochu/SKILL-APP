import Link from "next/link";
import { BOOKING_URL } from "@/lib/links";

export const metadata = { title: "Work with Salvador" };

const INCLUDED = [
  "A program built around your body, your schedule and your equipment, delivered in this app",
  "Weekly video check-ins on your form and your numbers",
  "Direct access to Salvador between check-ins",
  "Nutrition set up and adjusted as you go",
  "Targets reviewed every week so progress never stalls",
];

export default function WorkWithMePage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 self-start text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <IconChevron className="h-4 w-4 rotate-180" />
        Dashboard
      </Link>

      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">1:1 Coaching</span>
        <h1 className="text-2xl font-bold text-fg">Train with Salvador directly</h1>
        <p className="text-sm text-muted">
          The app gives you the plan and the tracking. 1:1 is the plan built entirely around you, plus
          someone watching your numbers every week and adjusting so you never stall.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">What&apos;s included</h2>
        <ul className="flex flex-col gap-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-fg">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-accent">Investment</h2>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tabular font-display text-2xl font-bold text-fg">&pound;350</span>
          <span className="text-sm text-muted">per month, rolling</span>
        </div>
        <p className="text-sm text-fg">
          Or <span className="tabular font-semibold">&pound;2,400</span> paid up front for six months
          &mdash; the equivalent of two months free.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          It starts with a free 15-minute call. We go through where you are, what you want, and whether
          1:1 is the right move for you right now. No pressure either way.
        </p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Book your free call
        </a>
      </section>
    </div>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
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
