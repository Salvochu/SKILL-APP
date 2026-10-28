import Link from "next/link";
import { getWorkoutSummary } from "@/lib/data/workouts";
import { getJourney } from "@/lib/data/journey";
import { KEEP_TRAINING_URL } from "@/lib/links";
import { signOut } from "@/app/actions";

// The whole app once a challenge account is past its 14 days + grace
// without converting - the proxy sends every in-app route to
// /challenge-ended, same full-lock treatment as a lapsed paid membership
// (components/membership/MembershipPaused.js). Only two ways forward:
// keep training, or work with Salvador 1:1.
export default async function ChallengeEnded() {
  const [summary, journey] = await Promise.all([getWorkoutSummary(), getJourney()]);
  const workouts = summary?.workouts ?? 0;

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          Your challenge has ended
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
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

      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-[var(--panel-warm)] to-surface p-5">
        <p className="text-[15px] leading-relaxed text-fg">
          Keep training and everything stays with you. Your streak, your level, your history, and your
          plan rolls into the next block.
        </p>
        <a
          href={KEEP_TRAINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-shine flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
        >
          Keep training for &pound;7.99/mo
        </a>
        <Link
          href="/work-with-me"
          className="flex w-full items-center justify-center rounded-2xl bg-accent-soft px-4 py-4 text-[17px] font-semibold text-accent transition-transform active:scale-[0.98]"
        >
          Or work with Salvador 1:1
        </Link>
      </section>

      <form action={signOut} className="self-center">
        <button
          type="submit"
          className="rounded-lg px-2 py-1 text-[14px] font-medium text-muted transition-colors hover:text-fg"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
