import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSplits } from "@/lib/data/splits";
import { getMesocycleTemplates, getActiveMesocycle } from "@/lib/data/mesocycles";
import { getBeginnerContext, getMembership } from "@/lib/data/profile";
import SplitDetail from "@/components/splits/SplitDetail";
import ChallengeProgramLocked from "@/components/challenge/ChallengeProgramLocked";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const split = (await getSplits()).find((s) => s.id === id);
  return { title: split ? split.name : "Split" };
}

export default function SplitPage({ params }) {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-72 rounded-2xl skeleton bg-surface-2" />}>
        <Body params={params} />
      </Suspense>
    </div>
  );
}

async function Body({ params }) {
  // A challenge account's plan is the challenge itself - the full splits
  // library (exercises, programs, everything) is a membership feature,
  // gated here before any split content loads at all, not just at the
  // "start program"/"log this" buttons further down the page.
  const membership = await getMembership();
  if (membership === "challenge") return <ChallengeProgramLocked />;

  const { id } = await params;
  const [splits, templates, active, beginner] = await Promise.all([
    getSplits(),
    getMesocycleTemplates(),
    getActiveMesocycle(),
    getBeginnerContext(),
  ]);

  const split = splits.find((s) => s.id === id);
  if (!split || split.section === "foundations") notFound();

  const template = beginner.isBeginner
    ? null
    : templates.find((t) => t.split?.id === split.id) ?? null;
  // A one-session split (Full Body) is its own only day: say it once,
  // with the day's own description, rather than a split header and then
  // a day header with the same name underneath it.
  const soleDay =
    split.days?.length === 1 && split.days[0].template?.name === split.name ? split.days[0] : null;
  const intro = soleDay?.template?.description || split.description;
  const activeProgram =
    active && !active.isComplete
      ? { splitName: active.splitName, week: active.week, weeks: active.weeks }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link
          href="/splits"
          className="-ml-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent active:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Train
        </Link>
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">{split.name}</h1>
        {split.cadence ? (
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">{split.cadence}</span>
        ) : null}
        {intro ? <p className="mt-1 text-[15px] leading-relaxed text-muted">{intro}</p> : null}
      </div>

      <SplitDetail
        split={split}
        template={template}
        activeProgram={activeProgram}
        advanced={beginner.advanced}
      />
    </div>
  );
}
