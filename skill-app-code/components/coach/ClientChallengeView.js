import Link from "next/link";
import ChallengeClimb from "@/components/challenge/ChallengeClimb";
import ChallengeTimeline from "@/components/challenge/ChallengeTimeline";
import { fromKg, unitLabel } from "@/lib/units";

// The coach's read-only view of a client's 14-Day Challenge - the same
// climb, numbers and checklist state the client sees on their own tab.
export default function ClientChallengeView({ clientId, data, unit = "kg" }) {
  const name = data.name || "This client";

  return (
    <div className="flex flex-col gap-5 py-2">
      <Link
        href={`/clients/${clientId}`}
        className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <IconBack className="h-5 w-5" />
        {name}
      </Link>

      <header className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          14-Day Main Character
        </span>
        <h1 className="text-balance font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">
          {name}&rsquo;s challenge
        </h1>
      </header>

      {!data.started ? (
        <div className="rounded-2xl bg-surface p-8 text-center text-[15px] text-muted">
          {data.membership !== "challenge"
            ? "This client isn't on the 14-Day Challenge."
            : data.prep
              ? "Getting set up. Their 14 days start when they tap start in the app."
              : "Signed up, but hasn't started the 14 days yet."}
        </div>
      ) : (
        <>
          <ChallengeClimb
            showTip={false}
            day={data.challengeDay}
            totalDays={data.challengeDays}
            completeDays={data.completeDays}
            streak={data.streak}
          />

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Day" value={`${Math.min(data.challengeDay, data.challengeDays)}/${data.challengeDays}`} />
            <Stat label="Sessions" value={`${data.sessions}/${data.targetSessions}`} />
            <Stat label="Perfect days" value={`${data.perfectDays}/14`} />
            <Stat
              label="Volume"
              value={`${Math.round(fromKg(data.volumeKg, unit)).toLocaleString("en-GB")} ${unitLabel(unit)}`}
            />
          </section>

          {data.complete ? (
            <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-black">
                <IconCheck className="h-[18px] w-[18px]" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[16px] font-semibold text-fg">Challenge complete</span>
                {data.topMuscles.length ? (
                  <span className="truncate text-[13px] text-muted">
                    Most trained: {data.topMuscles.map((m) => m.group).join(" · ")}
                  </span>
                ) : null}
              </span>
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
    <div className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="text-[24px] font-bold leading-none tracking-[-0.01em] text-fg tabular-nums">{value}</span>
    </div>
  );
}

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
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
