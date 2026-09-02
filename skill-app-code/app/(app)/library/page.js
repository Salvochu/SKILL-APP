import { Suspense } from "react";
import { getExercisesByCategory } from "@/lib/data/exercises";
import LibraryBrowser from "@/components/library/LibraryBrowser";

export const metadata = {
  title: "Library",
};

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Exercise library</h1>
        <p className="text-sm text-muted">
          Every movement in the programs, with a form video.
        </p>
      </header>

      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryList />
      </Suspense>
    </div>
  );
}

async function LibraryList() {
  const groups = await getExercisesByCategory();
  return <LibraryBrowser groups={groups} />;
}

function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-9 w-full rounded-field bg-surface" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-16 rounded-full bg-surface" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-card bg-surface" />
        ))}
      </div>
    </div>
  );
}
