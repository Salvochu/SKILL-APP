import Link from "next/link";

// Dashboard stand-in for the active-program panel while a challenge
// account is still in the prep window. The real "Start my 14 days"
// button lives on the Challenge tab; this just points them there.
export default function ChallengePrepCard({ startByLabel = null }) {
  return (
    <div className="challenge-start relative flex flex-col gap-4 overflow-hidden rounded-card border border-accent/30 p-5">
      <div
        aria-hidden="true"
        className="cc-bloom pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--panel-glow)" }}
      />
      <div className="relative flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          14-Day Main Character
        </span>
        <span className="font-display text-lg font-bold text-fg">
          Your 14 days haven&apos;t started yet
        </span>
        <span className="text-sm text-muted">
          Watch the welcome video, take your day 1 photos and do your food shop.
          Then start when you can train.
          {startByLabel ? ` Aim to begin by ${startByLabel}.` : ""}
        </span>
      </div>
      <Link
        href="/challenge"
        className="btn-shine relative w-full rounded-field bg-accent px-5 py-3 text-center font-display text-sm font-bold text-black shadow-[0_8px_24px_-8px_rgba(252,118,5,0.6)]"
      >
        Get set up and start
      </Link>
    </div>
  );
}
