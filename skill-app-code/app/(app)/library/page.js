import { Suspense } from "react";
import Link from "next/link";
import { getExercises, getStretches } from "@/lib/data/exercises";
import { getEducationVideos } from "@/lib/data/education";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Library</h1>
        <p className="text-sm text-muted">Movements, mobility work and short lessons, each with a video.</p>
      </header>

      <div className="flex flex-col gap-3">
        <SectionCard
          href="/library/exercises"
          title="Exercise Library"
          body="Every movement in the splits, with a form video and a how-to."
          icon={IconDumbbell}
        >
          <Suspense fallback={<CountSkeleton />}>
            <ExerciseCount />
          </Suspense>
        </SectionCard>

        <SectionCard
          href="/library/stretching"
          title="Stretching Library"
          body="Mobility and stretches to warm up and cool down."
          icon={IconStretch}
        >
          <Suspense fallback={<CountSkeleton />}>
            <StretchCount />
          </Suspense>
        </SectionCard>

        <SectionCard
          href="/library/education"
          title="Education Library"
          body="Short videos on how to train, progress and get the most from each session."
          icon={IconPlay}
        >
          <Suspense fallback={<CountSkeleton />}>
            <EducationCount />
          </Suspense>
        </SectionCard>
      </div>
    </div>
  );
}

async function ExerciseCount() {
  const rows = await getExercises();
  return <Count n={rows.length} one="exercise" many="exercises" />;
}
async function StretchCount() {
  const rows = await getStretches();
  return <Count n={rows.length} one="stretch" many="stretches" />;
}
async function EducationCount() {
  const rows = await getEducationVideos();
  return <Count n={rows.length} one="video" many="videos" />;
}

function Count({ n, one, many }) {
  return (
    <span className="text-xs font-medium text-dim">
      {n === 0 ? `No ${many} yet` : `${n} ${n === 1 ? one : many}`}
    </span>
  );
}
function CountSkeleton() {
  return <span className="inline-block h-3 w-16 rounded bg-surface-2" />;
}

function SectionCard({ href, title, body, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-base font-semibold text-fg">{title}</span>
          <IconChevron className="h-4 w-4 shrink-0 text-dim" />
        </span>
        <span className="text-sm text-muted">{body}</span>
        {children}
      </span>
    </Link>
  );
}

function IconDumbbell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 9v6M7.5 6.5v11M16.5 6.5v11M20 9v6M7.5 12h9" />
    </svg>
  );
}
function IconStretch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7v6M12 9l5-2M12 9 7 7M12 13l4 7M12 13l-4 7" />
    </svg>
  );
}
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5z" fill="currentColor" />
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
