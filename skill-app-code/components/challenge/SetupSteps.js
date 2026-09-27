import Link from "next/link";
import { SETUP_STEPS, SETUP_NOTE } from "@/lib/challenge/curriculum";
import MealPlanVideoButton from "@/components/challenge/MealPlanVideoButton";

// The "before you start" one-time setup steps, as a numbered list, plus a
// short reminder of the ongoing rules underneath. Shared by the prep
// screen and the collapsible reference card.
export default function SetupSteps() {
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3.5">
        {SETUP_STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black tabular-nums">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-fg">{s.title}</span>
              <span className="text-xs leading-relaxed text-muted">{s.detail}</span>
              {s.action === "photos" ? (
                <Link
                  href="/body"
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
                >
                  <IconCamera className="h-3 w-3" />
                  Upload your photos
                </Link>
              ) : null}
              {s.action === "meal-video" ? <MealPlanVideoButton /> : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-dim">{SETUP_NOTE}</p>
    </div>
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
