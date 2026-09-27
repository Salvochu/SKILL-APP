import Link from "next/link";
import { SETUP_STEPS } from "@/lib/challenge/curriculum";
import MealPlanVideoButton from "@/components/challenge/MealPlanVideoButton";

// Which small icon sits next to a step's title, keyed by its `action`.
// Kept out of the buttons themselves (see MealPlanVideoButton.js and the
// "Upload your photos" link below) so the buttons read as plain pills,
// not a second row of icons competing with the numbered badges.
const STEP_ICONS = {
  photos: IconCamera,
  "meal-video": IconPlay,
};

// The "before you start" setup steps, as a numbered list. Shared by the
// prep screen and the collapsible reference card.
export default function SetupSteps() {
  return (
    <ol className="flex flex-col gap-3.5">
      {SETUP_STEPS.map((s, i) => {
        const StepIcon = STEP_ICONS[s.action];
        return (
          <li key={s.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black tabular-nums">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                {StepIcon ? <StepIcon className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
                <span className="text-sm font-semibold text-fg">{s.title}</span>
              </span>
              <span className="text-xs leading-relaxed text-muted">{s.detail}</span>
              {s.action === "photos" ? (
                <Link
                  href="/body"
                  className="mt-1 inline-flex w-fit items-center rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
                >
                  Upload your photos
                </Link>
              ) : null}
              {s.action === "meal-video" ? <MealPlanVideoButton /> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function IconCamera(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
