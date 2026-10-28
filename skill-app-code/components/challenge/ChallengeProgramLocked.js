import Link from "next/link";
import { KEEP_TRAINING_URL } from "@/lib/links";

// Shown in place of the logger when an active challenge user opens a
// link to log a session from a program that is not the challenge. The
// challenge's own days and their own saved workouts still work.
export default function ChallengeProgramLocked() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          Part of a SKILL membership
        </span>
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          This program is locked
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          While your 14-Day Challenge is running, your plan is the challenge. The
          full training library unlocks when you continue with a membership.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
        <p className="text-[15px] leading-relaxed text-fg">
          Your challenge stays free and everything you log is saved. This only
          gates what comes after the 14 days.
        </p>
        <a
          href={KEEP_TRAINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
        >
          Continue for &pound;7.99/mo
        </a>
        <Link
          href="/challenge"
          className="flex w-full items-center justify-center rounded-2xl bg-fg/10 px-4 py-4 text-[17px] font-semibold text-fg transition-transform active:scale-[0.98]"
        >
          Back to my challenge
        </Link>
      </section>

      <p className="px-1 text-[14px] leading-relaxed text-muted">
        You can still build and run your own workouts from the{" "}
        <Link href="/splits" className="font-semibold text-accent">
          Train
        </Link>{" "}
        tab.
      </p>
    </div>
  );
}
