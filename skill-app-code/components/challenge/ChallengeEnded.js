import Link from "next/link";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getJourney } from "@/lib/data/journey";
import { KEEP_TRAINING_URL } from "@/lib/links";

// Shown in place of the logger once a challenge account is past its 14
// days (+ grace) without converting. Not a dead end: the rest of the app
// stays readable, and this points at both ways forward.
export default async function ChallengeEnded() {
  const [summary, journey] = await Promise.all([getWorkoutSummary(), getJourney()]);
  const workouts = summary?.workouts ?? 0;

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-2xl font-bold text-fg">Your challenge has ended</h1>
        <p className="text-sm text-muted">
          {workouts > 0 && journey ? (
            <>
              You logged{" "}
              <span className="font-semibold text-fg">
                {workouts} workout{workouts === 1 ? "" : "s"}
              </span>{" "}
              and reached{" "}
              <span className="font-semibold" style={{ color: journey.tierColor }}>
                {journey.tier} Level {journey.level}
              </span>
              . Don&apos;t lose the momentum.
            </>
          ) : (
            <>The 14 days are up. Pick it back up whenever you&apos;re ready.</>
          )}
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
        <p className="text-sm text-fg">
          Keep training and everything stays with you &mdash; your streak, your level, your history &mdash;
          and your plan rolls into the next block.
        </p>
        <a
          href={KEEP_TRAINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-3.5 text-base font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Keep training &mdash; &pound;14.99/mo
        </a>
        <Link
          href="/work-with-me"
          className="flex w-full items-center justify-center rounded-field border border-accent/40 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          Or work with Salvador 1:1
        </Link>
      </section>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/progress" className="font-medium text-muted transition-colors hover:text-fg">
          See your progress
        </Link>
        <Link href="/history" className="font-medium text-muted transition-colors hover:text-fg">
          Your workout history
        </Link>
        <Link href="/library" className="font-medium text-muted transition-colors hover:text-fg">
          Exercise library
        </Link>
      </div>
    </div>
  );
}
