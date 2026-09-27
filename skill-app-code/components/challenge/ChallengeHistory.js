import Link from "next/link";
import ChallengeClimb from "@/components/challenge/ChallengeClimb";
import ChallengeTimeline from "@/components/challenge/ChallengeTimeline";

// The read-only recap of a finished 14-Day Challenge, reached from Menu
// once someone has left the challenge tier (almost always by converting
// to a paying member). Same climb and day-by-day state they saw on the
// live Challenge tab, just no longer editable.
export default function ChallengeHistory({ data }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <Link href="/menu" className="flex items-center gap-1 self-start text-xs font-medium text-dim hover:text-fg">
        <IconBack className="h-3.5 w-3.5" />
        Menu
      </Link>

      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-2xl font-bold text-fg">Your challenge</h1>
      </header>

      <ChallengeClimb
        day={data.challengeDay}
        totalDays={data.totalDays}
        completeDays={data.completeDays}
        streak={data.streak}
      />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Sessions" value={`${data.sessions}/${data.targetSessions}`} />
        <Stat label="Perfect days" value={`${data.perfectDays}/${data.totalDays}`} />
        <Stat label="Volume" value={`${data.volumeKg.toLocaleString("en-GB")} kg`} />
        <Stat label="Best streak" value={data.streak} />
      </section>

      {data.completed ? (
        <div className="flex items-center gap-2 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
          <IconCheck className="h-4 w-4" />
          Challenge complete
          {data.topMuscles.length ? (
            <span className="ml-auto text-xs font-medium text-muted">
              Most trained: {data.topMuscles.map((m) => m.group).join(" · ")}
            </span>
          ) : null}
        </div>
      ) : null}

      <ChallengeTimeline
        challengeDay={data.challengeDay}
        byDay={data.byDay}
        byDayAt={data.byDayAt}
        readOnly
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-surface px-2 py-3 text-center">
      <span className="font-display text-lg font-bold text-fg tabular-nums">{value}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-dim">{label}</span>
    </div>
  );
}

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
