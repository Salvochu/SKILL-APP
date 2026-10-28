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
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Stretching Library</h1>
        <p className="text-[15px] leading-relaxed text-muted">Mobility and stretches to warm up and cool down.</p>
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
      <p className="rounded-2xl bg-surface p-8 text-center text-[15px] text-muted">
        Stretches are being added. Check back soon.
      </p>
    );
  }
  return <LibraryBrowser exercises={stretches} noun="stretch" canLog={false} />;
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

function Skeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-11 w-full rounded-xl skeleton bg-surface-2" />
      <div className="h-[28rem] w-full rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}
