import { Suspense } from "react";
import Link from "next/link";
import { getBodyLog } from "@/lib/data/body";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import BodyLogForm from "@/components/body/BodyLogForm";
import MetricChart from "@/components/body/MetricChart";
import { shortDate } from "@/components/progress/chartkit";

export const metadata = { title: "Body" };

export default function BodyPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="text-2xl font-bold text-fg">Body</h1>
        <p className="text-sm text-muted">Weight and measurements over time.</p>
      </header>

      <Suspense fallback={<div className="h-64 rounded-card bg-surface" />}>
        <BodyBody />
      </Suspense>
    </div>
  );
}

async function BodyBody() {
  const [{ entries, latest, weightChange, hasAny }, unit] = await Promise.all([
    getBodyLog(),
    getUnitPreference(),
  ]);
  const wu = unitLabel(unit);
  // Weight is stored in kg; measurements are always cm.
  const conv = (key, v) => (v == null ? null : key === "weight" ? Math.round(fromKg(v, unit) * 10) / 10 : v);
  const METRICS = [
    { key: "weight", label: "Weight", unit: ` ${wu}` },
    { key: "waist", label: "Waist", unit: " cm" },
    { key: "chest", label: "Chest", unit: " cm" },
    { key: "arm", label: "Arm", unit: " cm" },
    { key: "thigh", label: "Thigh", unit: " cm" },
    { key: "hip", label: "Hip", unit: " cm" },
  ];

  return (
    <>
      <BodyLogForm latest={latest} unit={unit} />

      {!hasAny ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No check-ins yet. Log your weight to start tracking.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRICS.map((m) => {
              const v = conv(m.key, latest?.[m.key]);
              if (v == null) return null;
              return (
                <div key={m.key} className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-dim">{m.label}</span>
                  <span className="tabular text-2xl font-bold text-fg">
                    {v}
                    <span className="text-sm font-medium text-dim">{m.unit}</span>
                  </span>
                  {m.key === "weight" && weightChange != null ? (
                    <span className={`text-xs ${weightChange === 0 ? "text-dim" : weightChange > 0 ? "text-good" : "text-accent"}`}>
                      {weightChange > 0 ? "+" : ""}
                      {Math.round(fromKg(weightChange, unit) * 10) / 10} {wu} recently
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {METRICS.map((m) => {
            const points = entries.map((e) => ({ date: e.date, value: conv(m.key, e[m.key]) }));
            if (points.filter((p) => p.value != null).length < 2) return null;
            return (
              <section key={m.key} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">{m.label}</h2>
                <MetricChart points={points} unit={m.unit} />
              </section>
            );
          })}

          <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">All check-ins</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-dim">
                    <th className="py-1 pr-4 font-medium">Date</th>
                    {METRICS.map((m) => (
                      <th key={m.key} className="py-1 pr-4 font-medium">{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular text-muted">
                  {[...entries].reverse().map((e) => (
                    <tr key={e.date} className="border-t border-border">
                      <td className="whitespace-nowrap py-1.5 pr-4 text-fg">{shortDate(e.date)}</td>
                      {METRICS.map((m) => (
                        <td key={m.key} className="py-1.5 pr-4">{conv(m.key, e[m.key]) ?? "–"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link href="/menu" className="flex items-center gap-1 text-xs font-medium text-dim hover:text-fg">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Menu
    </Link>
  );
}
