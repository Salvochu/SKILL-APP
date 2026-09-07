import Link from "next/link";
import MusclePill from "@/components/MusclePill";

// A shortlist of the lifts a beginner should learn first, pinned above
// the full library so 135 exercises are not the first thing they see.
export default function BeginnerStaples({ exercises }) {
  if (!exercises.length) return null;
  return (
    <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-base font-semibold text-fg">New to the gym? Start with these</h2>
        <p className="text-xs text-muted">
          The core lifts from the Foundations program. Get comfortable here first.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border">
        {exercises.map((e) => (
          <li key={e.id}>
            <Link
              href={`/library/exercises/${e.id}`}
              className="flex items-center gap-3 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{e.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <MusclePill muscle={e.muscle} />
                  <span className="text-xs text-dim">{e.equipment}</span>
                </span>
              </span>
              {e.video_url ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : null}
              <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
            </Link>
          </li>
        ))}
      </ul>
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
