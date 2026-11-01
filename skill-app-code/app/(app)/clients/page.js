import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClients } from "@/lib/data/coach";
import { getUnitPreference } from "@/lib/data/profile";
import ClientList from "@/components/coach/ClientList";
import InviteButton from "@/components/coach/InviteButton";
import ChallengeFunnel from "@/components/coach/ChallengeFunnel";
import TapLink from "@/components/TapLink";
import { getFeedbackNewCount } from "@/lib/data/feedback";

export const metadata = { title: "Clients" };
export const instant = false;

export default function ClientsPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-72 rounded-2xl skeleton bg-surface-2" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const [data, unit, newFeedback] = await Promise.all([getClients(), getUnitPreference(), getFeedbackNewCount()]);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Clients</h1>
          <InviteButton />
        </div>
        <p className="text-balance text-[15px] text-muted">Who is training, who is progressing, and who to talk to.</p>
      </header>
      <TapLink
        href="/clients/feedback"
        className="flex items-center gap-4 rounded-2xl bg-surface p-4 transition-colors hover:bg-surface-2 active:bg-surface-2"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5h16v11H8l-4 4z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-fg">Feedback inbox</span>
          <span className="block truncate text-sm text-muted">Bugs, missing videos and ideas</span>
        </span>
        {newFeedback > 0 ? (
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-black">
            {newFeedback} new
          </span>
        ) : null}
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-dim" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </TapLink>
      <ChallengeFunnel funnel={data.funnel} />
      <ClientList data={data} unit={unit} />
    </div>
  );
}
