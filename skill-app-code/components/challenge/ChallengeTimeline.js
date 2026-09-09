import ChallengeChecklist from "@/components/challenge/ChallengeChecklist";
import { CHALLENGE_DAYS } from "@/lib/challenge/curriculum";
import { isChallengeDayComplete } from "@/lib/data/challenge";

// The whole 14 days as a list. Past and current days open to their
// checklist so a day can be backfilled; future days show a preview only.
export default function ChallengeTimeline({ challengeDay, byDay = {} }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-dim">
        The 14 days
      </h2>
      <ul className="flex flex-col gap-2">
        {CHALLENGE_DAYS.map((d) => {
          const started = d.day <= challengeDay;
          const isToday = d.day === challengeDay;
          const complete = isChallengeDayComplete(byDay[d.day]);
          const missed = started && !isToday && !complete;

          return (
            <li key={d.day}>
              <details
                open={isToday}
                className="group overflow-hidden rounded-card border border-border bg-surface [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-field text-xs font-bold tabular-nums ${
                      complete
                        ? "bg-accent text-black"
                        : isToday
                          ? "bg-accent-soft text-accent ring-1 ring-accent"
                          : missed
                            ? "bg-surface-2 text-dim"
                            : "bg-surface-2 text-muted"
                    }`}
                  >
                    {complete ? (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6.5 5 9l5-6" />
                      </svg>
                    ) : (
                      d.day
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">
                      {d.title}
                      {isToday ? <span className="ml-2 text-xs font-semibold text-accent">Today</span> : null}
                    </span>
                    <span className="block truncate text-xs text-dim">
                      {missed ? "Not logged" : complete ? "Done" : kindHint(d.kind)}
                    </span>
                  </span>
                  <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-border">
                  <p className="px-4 py-3 text-sm leading-relaxed text-muted">{d.what}</p>
                  {started ? (
                    <div className="border-t border-border">
                      <ChallengeChecklist day={d.day} kind={d.kind} items={byDay[d.day] ?? {}} />
                    </div>
                  ) : (
                    <p className="border-t border-border px-4 py-3 text-xs text-dim">
                      Opens on day {d.day}.
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function kindHint(kind) {
  if (kind === "train") return "Full-body session";
  if (kind === "cardio") return "Easy cardio";
  return "Rest and recover";
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
