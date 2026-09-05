import { Suspense } from "react";
import Link from "next/link";
import { getExercises } from "@/lib/data/exercises";
import { MUSCLE_ORDER } from "@/lib/exercises";
import LibraryBrowser from "@/components/library/LibraryBrowser";

export const metadata = { title: "Exercise Library" };

export default function ExerciseLibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="text-2xl font-bold text-fg">Exercise Library</h1>
        <p className="text-sm text-muted">
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
  const exercises = await getExercises();
  return <LibraryBrowser exercises={exercises} noun="exercise" />;
}

function BackLink() {
  return (
    <Link href="/library" className="flex items-center gap-1 text-xs font-medium text-dim hover:text-fg">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Library
    </Link>
  );
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 w-full rounded-field bg-surface" />
      <div className="flex gap-2">
        {MUSCLE_ORDER.map((m) => (
          <div key={m} className="h-6 w-16 rounded-full bg-surface" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 w-full rounded-card bg-surface" />
        ))}
      </div>
    </div>
  );
}
