import { Suspense } from "react";
import { getMyFeedback, getFeedbackAccess } from "@/lib/data/feedback";
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
      <Suspense fallback={<div className="h-72 rounded-2xl skeleton bg-surface-2" />}>
        <Body />
      </Suspense>
    </div>
  );
}

// Lapsed and muted accounts can still read past messages, not send.
async function Body() {
  const [threads, access] = await Promise.all([getMyFeedback(), getFeedbackAccess()]);
  const open = access === "open";
  return (
    <>
      {open ? (
        <FeedbackForm />
      ) : (
        <p className="rounded-2xl bg-surface p-4 text-[15px] leading-relaxed text-muted">
          {access === "muted"
            ? "Sending feedback is paused on your account."
            : "Feedback is for active challengers and members. Join the SKILL App Membership to keep training and talking to Salvador."}
        </p>
      )}
      {threads.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">Your messages</h2>
          <FeedbackThreads threads={threads} viewer="client" markRead readOnly={!open} />
        </section>
      ) : null}
    </>
  );
}
