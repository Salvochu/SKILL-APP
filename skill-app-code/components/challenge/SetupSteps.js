import { SETUP_STEPS } from "@/lib/challenge/curriculum";

// The four "before you start" non-negotiables, as a numbered list.
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
            <span className="text-sm font-semibold text-fg">{s.title}</span>
            <span className="text-xs leading-relaxed text-muted">{s.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
