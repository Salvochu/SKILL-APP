import { Suspense } from "react";
import Link from "next/link";
import { getExercises, getStretches } from "@/lib/data/exercises";
import { getEducationVideos } from "@/lib/data/education";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Library</h1>
        <p className="text-[15px] leading-relaxed text-muted">Movements, mobility work and short lessons, each with a video.</p>
      </header>

      <div className="overflow-hidden rounded-2xl bg-surface [&>:first-child_.lib-sep]:border-transparent">
        <SectionRow
          href="/library/exercises"
          title="Exercise Library"
          body="Every movement in the splits, with a form video and a how-to."
          icon={IconDumbbell}
          tint="#fc7605"
        >
          <Suspense fallback={<CountSkeleton />}>
            <ExerciseCount />
          </Suspense>
        </SectionRow>

        <SectionRow
          href="/library/stretching"
          title="Stretching Library"
          body="Mobility and stretches to warm up and cool down."
          icon={IconStretch}
          tint="#1faa77"
        >
          <Suspense fallback={<CountSkeleton />}>
            <StretchCount />
          </Suspense>
        </SectionRow>

        <SectionRow
          href="/library/education"
          title="Education Library"
          body="Short videos on how to train, progress and get the most from each session."
          icon={IconPlay}
          tint="#9085e9"
        >
          <Suspense fallback={<CountSkeleton />}>
            <EducationCount />
          </Suspense>
        </SectionRow>
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
    <span className="text-[13px] font-medium text-dim tabular-nums">
      {n === 0 ? `No ${many} yet` : `${n} ${n === 1 ? one : many}`}
    </span>
  );
}
function CountSkeleton() {
  return <span className="inline-block h-3 w-16 rounded-full bg-surface-2" />;
}

// Same rows as the Menu: a solid tinted tile, hairlines inset past it.
function SectionRow({ href, title, body, icon: Icon, tint, children }) {
  return (
    <Link href={href} className="flex items-start gap-3.5 pl-4 transition-colors hover:bg-surface-2 active:bg-surface-2">
      <span
        className="mt-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white"
        style={{ backgroundColor: tint }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="lib-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3.5 pr-4">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{title}</span>
          <span className="text-[14px] leading-snug text-muted">{body}</span>
          <span className="pt-0.5">{children}</span>
        </span>
        <IconChevron className="h-4 w-4 shrink-0 text-dim" />
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7v6M12 9l5-2M12 9 7 7M12 13l4 7M12 13l-4 7" />
    </svg>
  );
}
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
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
