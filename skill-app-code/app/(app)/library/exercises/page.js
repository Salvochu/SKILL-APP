import { Suspense } from "react";
import Link from "next/link";
import { getExercises } from "@/lib/data/exercises";
import { getBeginnerContext } from "@/lib/data/profile";
import { MUSCLE_ORDER, BEGINNER_STAPLE_NAMES } from "@/lib/exercises";
import LibraryBrowser from "@/components/library/LibraryBrowser";
import BeginnerStaples from "@/components/library/BeginnerStaples";

export const metadata = { title: "Exercise Library" };

export default function ExerciseLibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Exercise Library</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Every movement in the splits, with a form video and a how-to.
        </p>
      </header>

      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryList />
      </Suspense>
    </div>
  );
}

async function LibraryList() {
  const [exercises, beginner] = await Promise.all([getExercises(), getBeginnerContext()]);
  const staples = beginner.isBeginner
    ? BEGINNER_STAPLE_NAMES.map((n) => exercises.find((e) => e.name === n)).filter(Boolean)
    : [];
  return (
    <div className="flex flex-col gap-6">
      {staples.length > 0 ? <BeginnerStaples exercises={staples} /> : null}
      <LibraryBrowser exercises={exercises} noun="exercise" />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/library"
      className="-ml-1 mb-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Library
    </Link>
  );
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-11 w-full rounded-xl skeleton bg-surface-2" />
      <div className="flex gap-2 overflow-hidden">
        {MUSCLE_ORDER.map((m) => (
          <div key={m} className="h-8 w-20 shrink-0 rounded-full skeleton bg-surface-2" />
        ))}
      </div>
      <div className="h-[28rem] w-full rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}
