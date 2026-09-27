import Link from "next/link";
import { SETUP_STEPS } from "@/lib/challenge/curriculum";
import MealPlanVideoButton from "@/components/challenge/MealPlanVideoButton";

// The "before you start" setup steps, as a numbered list. A step with an
// action (photos, meal-video) gets a small clickable icon on the right of
// its title instead of a pill button underneath - the icon IS the action.
// Shared by the prep screen and the collapsible reference card.
export default function SetupSteps() {
  return (
    <ol className="flex flex-col gap-3.5">
      {SETUP_STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black tabular-nums">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 text-sm font-semibold text-fg">{s.title}</span>
              {s.action === "photos" ? (
                <Link
                  href="/body"
                  aria-label="Upload your photos"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-black"
                >
                  <IconCamera className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              {s.action === "meal-video" ? <MealPlanVideoButton /> : null}
            </span>
            <span className="text-xs leading-relaxed text-muted">{s.detail}</span>
          </span>
        </li>
      ))}
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
