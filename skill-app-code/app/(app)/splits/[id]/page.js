import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSplits } from "@/lib/data/splits";
import { getMesocycleTemplates, getActiveMesocycle } from "@/lib/data/mesocycles";
import { getBeginnerContext } from "@/lib/data/profile";
import SplitDetail from "@/components/splits/SplitDetail";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const split = (await getSplits()).find((s) => s.id === id);
  return { title: split ? split.name : "Split" };
}

export default function SplitPage({ params }) {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="h-72 rounded-card bg-surface" />}>
        <Body params={params} />
      </Suspense>
    </div>
  );
}

async function Body({ params }) {
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
  const activeProgram =
    active && !active.isComplete
      ? { splitName: active.splitName, week: active.week, weeks: active.weeks }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link
          href="/splits"
          className="flex items-center gap-1 self-start text-xs font-medium text-dim hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
          Train
        </Link>
        <h1 className="text-2xl font-bold text-fg">{split.name}</h1>
        {split.description ? <p className="text-sm text-muted">{split.description}</p> : null}
        <span className="mt-1 self-start rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-dim">
          {split.cadence}
        </span>
      </div>

      <SplitDetail split={split} template={template} activeProgram={activeProgram} />
    </div>
  );
}
