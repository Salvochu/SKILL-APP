import Link from "next/link";
import ChallengeClimb from "@/components/challenge/ChallengeClimb";
import ChallengeTimeline from "@/components/challenge/ChallengeTimeline";
import { fromKg, unitLabel } from "@/lib/units";

// The read-only recap of a finished 14-Day Challenge, reached from Menu
// once someone has left the challenge tier (almost always by converting
// to a paying member). Same climb and day-by-day state they saw on the
// live Challenge tab, just no longer editable.
export default function ChallengeHistory({ data, unit = "kg" }) {
  return (
    <div className="flex flex-col gap-6 py-2">
      <Link
        href="/menu"
        className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <IconBack className="h-5 w-5" />
        Menu
      </Link>

      <header className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          14-Day Main Character
        </span>
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Your challenge</h1>
      </header>

      <ChallengeClimb
        showTip={false}
        day={data.challengeDay}
        totalDays={data.totalDays}
        completeDays={data.completeDays}
        streak={data.streak}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions" value={`${data.sessions}/${data.targetSessions}`} />
        <Stat label="Perfect days" value={`${data.perfectDays}/${data.totalDays}`} />
        <Stat
          label="Volume"
          value={`${Math.round(fromKg(data.volumeKg, unit)).toLocaleString("en-GB")} ${unitLabel(unit)}`}
        />
        <Stat label="Best streak" value={data.streak} />
      </section>

      {data.completed ? (
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
