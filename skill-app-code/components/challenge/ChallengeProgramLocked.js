import Link from "next/link";
import { KEEP_TRAINING_URL } from "@/lib/links";

// Shown in place of the logger when an active challenge user opens a
// link to log a session from a program that is not the challenge. The
// challenge's own days and their own saved workouts still work.
export default function ChallengeProgramLocked() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Part of a SKILL membership
        </span>
        <h1 className="text-2xl font-bold text-fg">This program is locked</h1>
        <p className="text-sm text-muted">
          While your 14-Day Challenge is running, your plan is the challenge. The
          full training library unlocks when you continue with a membership.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
        <p className="text-sm text-fg">
          Your challenge stays free and everything you log is saved. This only
          gates what comes after the 14 days.
        </p>
        <a
          href={KEEP_TRAINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Continue for &pound;14.99/mo
        </a>
        <Link
          href="/challenge"
          className="flex w-full items-center justify-center rounded-field border border-accent/40 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          Back to my challenge
        </Link>
      </section>

      <p className="text-sm text-dim">
        You can still build and run your own workouts from the{" "}
        <Link href="/splits" className="font-medium text-muted underline hover:text-fg">
          Train
        </Link>{" "}
        tab.
      </p>
    </div>
  );
}
