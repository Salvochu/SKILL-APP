import Link from "next/link";
import ChallengeClimb from "@/components/challenge/ChallengeClimb";
import ChallengeTimeline from "@/components/challenge/ChallengeTimeline";

// The coach's read-only view of a client's 14-Day Challenge - the same
// climb, numbers and checklist state the client sees on their own tab.
export default function ClientChallengeView({ clientId, data }) {
  const name = data.name || "This client";

  return (
    <div className="flex flex-col gap-5 py-2">
      <Link
        href={`/clients/${clientId}`}
        className="flex items-center gap-1 self-start text-xs font-medium text-dim hover:text-fg"
      >
        <IconBack className="h-3.5 w-3.5" />
        Back to {name}
      </Link>

      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-2xl font-bold text-fg">{name}&rsquo;s challenge</h1>
      </header>

      {!data.started ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          {data.membership === "challenge"
            ? "Signed up, but hasn't started the 14 days yet."
            : "This client isn't on the 14-Day Challenge."}
        </div>
      ) : (
        <>
          <ChallengeClimb
            day={data.challengeDay}
            totalDays={data.challengeDays}
            completeDays={data.completeDays}
            streak={data.streak}
          />

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Day" value={`${Math.min(data.challengeDay, data.challengeDays)}/${data.challengeDays}`} />
            <Stat label="Sessions" value={`${data.sessions}/${data.targetSessions}`} />
            <Stat label="Perfect days" value={`${data.perfectDays}/14`} />
            <Stat label="Volume" value={`${data.volumeKg.toLocaleString("en-GB")} kg`} />
          </section>

          {data.complete ? (
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

          <ChallengeTimeline challengeDay={data.challengeDay} byDay={data.byDay} readOnly />
        </>
      )}
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
