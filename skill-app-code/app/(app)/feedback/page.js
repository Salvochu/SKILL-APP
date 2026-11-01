import { Suspense } from "react";
import { getMyFeedback } from "@/lib/data/feedback";
import BackLink from "@/components/ui/BackLink";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackThreads from "@/components/feedback/FeedbackThreads";

export const metadata = { title: "Feedback" };

// Replaces the old "Report an issue" email link: feedback goes straight
// to Salvador inside the app, and his replies come back here.
export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Feedback</h1>
        <p className="text-balance text-[15px] text-muted">
          Something broken, a video missing, or an idea? Tell me here and I’ll reply in the app.
        </p>
      </header>
      <FeedbackForm />
      <Suspense fallback={<div className="h-24 rounded-2xl skeleton bg-surface-2" />}>
        <MyThreads />
      </Suspense>
    </div>
  );
}

async function MyThreads() {
  const threads = await getMyFeedback();
  if (!threads.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Your messages</h2>
      <FeedbackThreads threads={threads} viewer="client" markRead />
    </section>
  );
}
