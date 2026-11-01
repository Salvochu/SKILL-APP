import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFeedbackInbox } from "@/lib/data/feedback";
import BackLink from "@/components/ui/BackLink";
import FeedbackInbox from "@/components/feedback/FeedbackInbox";

export const metadata = { title: "Feedback inbox" };
export const instant = false;

// Coach only: every client's feedback, newest activity first.
export default function FeedbackInboxPage() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <header className="flex flex-col gap-1">
        <BackLink href="/clients" label="Clients" />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Feedback</h1>
        <p className="text-balance text-[15px] text-muted">Bugs, missing videos and ideas from your clients.</p>
      </header>
      <Suspense fallback={<div className="h-48 rounded-2xl skeleton bg-surface-2" />}>
        <Inbox />
      </Suspense>
    </div>
  );
}

async function Inbox() {
  const inbox = await getFeedbackInbox();
  if (!inbox) notFound();
  if (inbox.missingTable) {
    return (
      <p className="rounded-2xl bg-surface p-5 text-[15px] text-muted">
        Feedback isn’t switched on yet: run migration 0049_feedback.sql in Supabase.
      </p>
    );
  }
  return <FeedbackInbox threads={inbox.threads} />;
}
