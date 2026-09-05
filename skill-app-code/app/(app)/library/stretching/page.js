import { Suspense } from "react";
import Link from "next/link";
import { getStretches } from "@/lib/data/exercises";
import LibraryBrowser from "@/components/library/LibraryBrowser";

export const metadata = { title: "Stretching Library" };

export default function StretchingLibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="text-2xl font-bold text-fg">Stretching Library</h1>
        <p className="text-sm text-muted">Mobility and stretches to warm up and cool down.</p>
      </header>

      <Suspense fallback={<Skeleton />}>
        <StretchList />
      </Suspense>
    </div>
  );
}

async function StretchList() {
  const stretches = await getStretches();
  if (stretches.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">
        Stretches are being added. Check back soon.
      </p>
    );
  }
  return <LibraryBrowser exercises={stretches} noun="stretch" canLog={false} />;
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

function Skeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 w-full rounded-card bg-surface" />
      ))}
    </div>
  );
}
