import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import TodayVideo from "@/components/challenge/TodayVideo";
import ChallengeChecklist from "@/components/challenge/ChallengeChecklist";
import LearnPrompt from "@/components/challenge/LearnPrompt";

const KIND_LABEL = { train: "Training", cardio: "Cardio", rest: "Rest" };

// The one card that matters today: what to do, the video for it, a
// button straight into the logger for training days, and today's
// checklist.
export default function ChallengeToday({ day, challengeDay, mesoId, variant, items, itemsAt }) {
  if (!day) return null;
  const trainHref =
    day.kind === "train" && day.dayTemplateId && mesoId
      ? `/log?meso=${mesoId}&split=main-character-14&day=${day.dayTemplateId}&variant=${encodeURIComponent(variant || "Full Gym")}`
      : null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
            Day {challengeDay} &middot; Today &middot; {KIND_LABEL[day.kind] ?? "Today"}
          </span>
          <h2 className="text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] text-fg">
            {day.title}
          </h2>
          <p className="text-[15px] leading-relaxed text-muted">{day.what}</p>
        </div>

        <TodayVideo
          day={challengeDay}
          loomId={day.loomId}
          title={`Day ${day.day}: ${day.title}`}
          watched={items?.video === true}
        />
        {trainHref ? (
          <GuardedStartLink
            href={trainHref}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
          >
            <IconPlay className="h-4 w-4" />
            Start {day.title}
          </GuardedStartLink>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface">
        <ChallengeChecklist day={challengeDay} kind={day.kind} items={items} itemsAt={itemsAt} />
        {challengeDay === 1 ? <LearnPrompt /> : null}
        <TapLink
          href="/body"
          className="flex items-center justify-between gap-2 border-t border-border/70 px-4 py-3.5 text-[16px] font-medium text-accent transition-colors hover:bg-surface-2 active:bg-surface-2"
        >
          <span>Log today&apos;s weight</span>
          <IconChevron className="h-4 w-4 shrink-0" />
        </TapLink>
      </div>
    </section>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 4.8v14.4a1 1 0 0 0 1.53.85l11.2-7.2a1 1 0 0 0 0-1.7L8.53 3.95A1 1 0 0 0 7 4.8Z" />
    </svg>
  );
}
