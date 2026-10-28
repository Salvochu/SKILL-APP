import Link from "next/link";
import { BOOKING_URL, COACHING_PAYMENT_URL } from "@/lib/links";

export const metadata = { title: "Work with Salvador" };

const INCLUDED = [
  "Your whole plan built from scratch around your body, your history, your schedule and the equipment you have",
  "Nutrition targets set to your numbers and tracked in the app, adjusted every week as the scale and the mirror move",
  "Form videos reviewed and sent back with fixes every week",
  "A direct line to me between check-ins, replies within 24 hours",
  "The SK Fitness client community, training alongside other people doing the same",
  "A full weekly review, so the moment progress slows we change something",
];

export default function WorkWithMePage() {
  return (
    <div className="flex flex-col gap-7 py-2">
      <Link
        href="/dashboard"
        className="-ml-1 -mb-3 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <IconChevron className="h-5 w-5 rotate-180" />
        Dashboard
      </Link>

      <header className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">1:1 Coaching</span>
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          Train with Salvador directly
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          SKILL gives you a solid plan and the tracking to run it. 1:1 is a plan built entirely
          around you, with someone watching your numbers every week and changing them the moment
          you stall.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">What you get</h2>
        <ul className="overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3 pl-4">
              <span className="mt-3.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                <IconCheck className="h-3.5 w-3.5" />
              </span>
              <span className="row-sep flex-1 border-t border-border/70 py-3.5 pr-4 text-[15px] leading-snug text-fg">
                {item}
              </span>
            </li>
          ))}
        </ul>
        <p className="px-4 text-[13px] leading-snug text-dim">
          Everything runs in the SK Fitness coaching app: your plan, your nutrition, your check-ins,
          your messages and the community, in one place. You get set up there when you start.
        </p>
      </section>

      <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--panel-glow)" }}
        />
        <div className="relative flex flex-col gap-1">
          <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">Investment</h2>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="tabular text-[44px] font-bold leading-none tracking-[-0.02em] text-fg">&pound;350</span>
            <span className="text-[17px] font-semibold text-muted">per month</span>
          </div>
          <p className="text-[15px] text-muted">Rolling. Cancel any time.</p>
        </div>

        <p className="relative text-[15px] leading-relaxed text-muted">
          It starts with a free 15-minute call. We go through where you are, what you want, and whether
          1:1 is the right move for you right now. No pressure either way.
        </p>

        <div className="relative flex flex-col gap-2">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
          >
            <IconCalendar className="h-[18px] w-[18px]" />
            Book your free call
          </a>
          <a
            href={COACHING_PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl py-2.5 text-center text-[15px] font-semibold text-accent transition-opacity active:opacity-60"
          >
            Already sure? Get started at &pound;350/mo
          </a>
        </div>
      </section>
    </div>
  );
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
