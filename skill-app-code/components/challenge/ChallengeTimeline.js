import ChallengeChecklist from "@/components/challenge/ChallengeChecklist";
import { CHALLENGE_DAYS } from "@/lib/challenge/curriculum";
import { isChallengeDayComplete } from "@/lib/data/challenge";

// The whole 14 days as a list. Past and current days open to their
// checklist so a day can be backfilled; future days show a preview only.
// Collapsed by default - today's own card above already has what matters
// most, this is reference material someone opens on purpose.
export default function ChallengeTimeline({ challengeDay, byDay = {}, byDayAt = {}, readOnly = false }) {
  return (
    <details className="group/tl flex flex-col [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-1">
        <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
          The 14 days
        </h2>
        <IconSectionChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open/tl:rotate-180" />
      </summary>
      <ul className="mt-2 flex flex-col overflow-hidden rounded-2xl bg-surface [&>li:first-child_.day-sep]:border-transparent">
        {CHALLENGE_DAYS.map((d) => {
          const started = d.day <= challengeDay;
          const isToday = d.day === challengeDay;
          const complete = isChallengeDayComplete(byDay[d.day]);
          const missed = started && !isToday && !complete;

          return (
            <li key={d.day}>
              <details open={isToday} className="group/day [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ${
                      complete
                        ? "bg-accent text-black"
                        : isToday
                          ? "bg-accent-soft text-accent ring-[1.5px] ring-inset ring-accent"
                          : missed
                            ? "bg-fg/10 text-dim"
                            : "bg-fg/[0.06] text-muted"
                    }`}
                  >
                    {complete ? (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 6.5 5 9l4.5-5.5" />
                      </svg>
                    ) : (
                      d.day
                    )}
                  </span>
                  <span className="day-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[16px] font-semibold text-fg">{d.title}</span>
                        {isToday ? (
                          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-semibold text-accent">
                            Today
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-[13px] text-dim">
                        {missed ? "Not logged" : complete ? "Done" : kindHint(d.kind)}
                      </span>
                    </span>
                    <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open/day:rotate-90" />
                  </span>
                </summary>
                <div className="pb-2">
                  {started ? (
                    <>
                      <p className="pb-1 pl-[60px] pr-4 text-[15px] leading-relaxed text-muted">{d.what}</p>
                      {isToday ? (
                        <p className="pb-2 pl-[60px] pr-4 pt-1 text-[13px] text-dim">
                          Today&apos;s checklist is in the card above.
                        </p>
                      ) : (
                        <ChallengeChecklist
                          day={d.day}
                          kind={d.kind}
                          items={byDay[d.day] ?? {}}
                          itemsAt={byDayAt[d.day] ?? {}}
                          locked={readOnly}
                          indent
                        />
                      )}
                    </>
                  ) : (
                    // Future days stay a locked preview: the kind ("Full-body
                    // session" etc.) is visible in the summary row above so
                    // the week's shape is still readable, but the specific
                    // lifts and the callback to an earlier day's numbers
                    // ("beat a number from Day X") stay hidden until it's
                    // actually that day.
                    <p className="flex items-center gap-1.5 pb-1 pl-[60px] pr-4 text-[14px] text-dim">
                      <IconLock className="h-3.5 w-3.5" />
                      Opens on day {d.day}
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function kindHint(kind) {
  if (kind === "train") return "Full-body session";
  if (kind === "cardio") return "Easy cardio";
  return "Rest and recover";
}

function IconSectionChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
