import Link from "next/link";

// Dashboard stand-in for the active-program panel while a challenge
// account is still in the prep window. The real "Start my 14 days"
// button lives on the Challenge tab; this just points them there.
export default function ChallengePrepCard() {
  return (
    <div className="challenge-start relative flex flex-col gap-5 overflow-hidden rounded-2xl p-5">
      <div
        aria-hidden="true"
        className="cc-bloom pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <div className="relative flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          14-Day Main Character
        </span>
        <h2 className="text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
          Your 14 days haven&apos;t started yet
        </h2>
        <p className="text-[15px] leading-relaxed text-muted">
          Watch the welcome video, take your day 1 photos and do your food shop.
          Then start when you can train. Aim to begin within 48 hours of signing up.
        </p>
      </div>
      <Link
        href="/challenge"
        className="btn-shine relative z-[2] flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
      >
        Get set up and start
      </Link>
    </div>
  );
}
