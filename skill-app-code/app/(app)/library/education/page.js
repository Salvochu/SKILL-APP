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
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Education Library</h1>
        <p className="text-[15px] leading-relaxed text-muted">
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
      <p className="rounded-2xl bg-surface p-8 text-center text-[15px] text-muted">
        Lessons are being added. Check back soon.
      </p>
    );
  }
  return <EducationList videos={videos} />;
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
    <div className="h-80 w-full rounded-2xl skeleton bg-surface-2" />
  );
}
