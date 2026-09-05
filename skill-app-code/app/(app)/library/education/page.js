import { Suspense } from "react";
import Link from "next/link";
import { getEducationVideos } from "@/lib/data/education";
import EducationList from "@/components/library/EducationList";

export const metadata = { title: "Education Library" };

export default function EducationLibraryPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="text-2xl font-bold text-fg">Education Library</h1>
        <p className="text-sm text-muted">
          Short videos on how to train, progress and get the most from each session.
        </p>
      </header>

      <Suspense fallback={<Skeleton />}>
        <VideoList />
      </Suspense>
    </div>
  );
}

async function VideoList() {
  const videos = await getEducationVideos();
  if (videos.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">
        Lessons are being added. Check back soon.
      </p>
    );
  }
  return <EducationList videos={videos} />;
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 w-full rounded-card bg-surface" />
      ))}
    </div>
  );
}
