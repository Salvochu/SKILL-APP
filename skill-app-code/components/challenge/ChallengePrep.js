import LoomEmbed from "@/components/challenge/LoomEmbed";
import SetupSteps from "@/components/challenge/SetupSteps";
import StartChallengeButton from "@/components/challenge/StartChallengeButton";
import { getLesson } from "@/lib/challenge/curriculum";

// Shown in place of the Challenge tab (and the logger) while a challenge
// account is still getting set up. The 14-day clock has not started: it
// begins only when they tap "Start my 14 days", so someone who buys at
// night or cannot train today loses no days.
export default function ChallengePrep({ startByLabel = null }) {
  const welcome = getLesson("start-here");

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-2xl font-bold text-fg">Get set up, then start</h1>
        <p className="text-sm text-muted">
          Your 14 days begin the moment you tap start, so start on a day you can
          actually train.{" "}
          {startByLabel
            ? `Aim to begin by ${startByLabel}.`
            : "Whenever you are ready this week is fine."}
        </p>
      </header>

      <section className="challenge-start relative flex flex-col gap-5 overflow-hidden rounded-card border border-accent/30 p-5">
        <div
          aria-hidden="true"
          className="cc-bloom pointer-events-none absolute -left-20 -top-16 h-52 w-52 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--panel-glow)" }}
        />
        <div className="relative flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Before you start
          </span>
          <span className="font-display text-lg font-bold text-fg">
            Set yourself up for the 14 days
          </span>
        </div>

        <div className="relative">
          <LoomEmbed id={welcome?.loomId} title="Start here: how the 14 days work" />
        </div>

        <div className="relative">
          <SetupSteps />
        </div>

        <div className="relative border-t border-accent/20 pt-5">
          <StartChallengeButton />
        </div>
      </section>

      <p className="text-center text-xs text-dim">
        Nothing else in the app unlocks until your 14 days are running.
      </p>
    </div>
  );
}
