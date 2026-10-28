import { Suspense } from "react";
import Link from "next/link";
import { getBodyLog } from "@/lib/data/body";
import { getProgressPhotos } from "@/lib/data/photos";
import { getUnitPreference } from "@/lib/data/profile";
import { fromKg, unitLabel } from "@/lib/units";
import BodyLogForm from "@/components/body/BodyLogForm";
import ProgressPhotos from "@/components/body/ProgressPhotos";
import MetricChart from "@/components/body/MetricChart";
import { shortDate } from "@/components/progress/chartkit";

export const metadata = { title: "Body" };

export default function BodyPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-1">
        <BackLink />
        <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-fg">Body</h1>
        <p className="text-[15px] text-muted">Weight and measurements over time.</p>
      </header>

      <Suspense fallback={<BodySkeleton />}>
        <BodyBody />
      </Suspense>
    </div>
  );
}

async function BodyBody() {
  const [{ entries, latest, weightChange, hasAny }, photos, unit] = await Promise.all([
    getBodyLog(),
    getProgressPhotos(),
    getUnitPreference(),
  ]);
  const wu = unitLabel(unit);
  // Weight is stored in kg; measurements are always cm.
  const conv = (key, v) => (v == null ? null : key === "weight" ? Math.round(fromKg(v, unit) * 10) / 10 : v);
  const METRICS = [
    { key: "weight", label: "Weight", unit: ` ${wu}` },
    { key: "fat", label: "Body fat", unit: " %" },
    { key: "waist", label: "Waist", unit: " cm" },
    { key: "chest", label: "Chest", unit: " cm" },
    { key: "arm", label: "Arm", unit: " cm" },
    { key: "thigh", label: "Thigh", unit: " cm" },
    { key: "hip", label: "Hip", unit: " cm" },
  ];

  const bodyByDate = Object.fromEntries(
    entries.map((e) => [e.date, { weight: conv("weight", e.weight), fat: e.fat }]),
  );

  // Each metric's own history: a check-in that only logged weight should
  // not hide the last waist measurement.
  const series = Object.fromEntries(
    METRICS.map((m) => {
      const points = entries
        .filter((e) => e[m.key] != null)
        .map((e) => ({ date: e.date, value: conv(m.key, e[m.key]) }));
      return [m.key, points];
    }),
  );
  const tape = METRICS.slice(2).filter((m) => series[m.key].length > 0);

  return (
    <div className="flex flex-col gap-6">
      <BodyLogForm latest={latest} unit={unit} />

      <ProgressPhotos dates={photos.dates} bodyByDate={bodyByDate} unit={wu} />

      {!hasAny ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconScale className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-[17px] font-semibold text-fg">No check-ins yet</p>
            <p className="text-[15px] text-muted">Log your weight to start tracking.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {series.weight.length > 0 ? (
            <MetricCard
              label="Weight"
              points={series.weight}
              unit={wu}
              chartUnit={` ${wu}`}
              note={
                weightChange != null ? (
                  <span
                    className={`text-[13px] font-semibold tabular-nums ${
                      weightChange === 0 ? "text-muted" : weightChange > 0 ? "text-good" : "text-accent"
                    }`}
                  >
                    {weightChange > 0 ? "+" : ""}
                    {Math.round(fromKg(weightChange, unit) * 10) / 10} {wu} recently
                  </span>
                ) : null
              }
            />
          ) : null}

          {series.fat.length > 0 ? (
            <MetricCard label="Body fat" points={series.fat} unit="%" chartUnit=" %" />
          ) : null}

          {tape.length > 0 ? (
            <section className="mt-3 flex flex-col gap-2">
              <h2 className="px-4 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
                Measurements
              </h2>
              <div className="overflow-hidden rounded-2xl bg-surface [&>*+*]:border-t [&>*+*]:border-border/70">
                {tape.map((m) => {
                  const pts = series[m.key];
                  const row = <MeasureRow label={m.label} points={pts} expandable={pts.length >= 2} />;
                  return pts.length >= 2 ? (
                    <details key={m.key} className="group/m [&_summary::-webkit-details-marker]:hidden">
                      <summary className="cursor-pointer list-none transition-colors hover:bg-surface-2 active:bg-surface-2">
                        {row}
                      </summary>
                      <div className="px-4 pb-4">
                        <MetricChart points={pts} unit=" cm" />
                      </div>
                    </details>
                  ) : (
                    <div key={m.key}>{row}</div>
                  );
                })}
              </div>
              <p className="px-4 text-[13px] text-dim">Tap a measurement to see its trend.</p>
            </section>
          ) : null}

          <details className="group/all mt-3 rounded-2xl bg-surface [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-colors active:bg-surface-2">
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-fg">All check-ins</span>
              <span className="flex items-center gap-2 text-[15px] text-muted">
                <span className="tabular-nums">{entries.length}</span>
                <IconChevron className="h-4 w-4 text-dim transition-transform group-open/all:rotate-90" />
              </span>
            </summary>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="text-[12px] uppercase tracking-[0.04em] text-dim">
                    <th className="whitespace-nowrap py-1.5 pr-4 font-semibold">Date</th>
                    {METRICS.map((m) => (
                      <th key={m.key} className="whitespace-nowrap py-1.5 pr-4 font-semibold">{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular-nums text-muted">
                  {[...entries].reverse().map((e) => (
                    <tr key={e.date} className="border-t border-border/70">
                      <td className="whitespace-nowrap py-2 pr-4 font-medium text-fg">{shortDate(e.date)}</td>
                      {METRICS.map((m) => {
                        const v = conv(m.key, e[m.key]);
                        return (
                          <td key={m.key} className={`py-2 pr-4 ${v == null ? "text-dim" : ""}`}>
                            {v ?? "n/a"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// A headline metric (weight, body fat): its latest value large, with the
// trend under it once there are two or more check-ins.
function MetricCard({ label, points, unit, chartUnit, note = null }) {
  const last = points[points.length - 1];
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">{label}</h2>
          <span className="tabular text-[34px] font-bold leading-none tracking-[-0.01em] text-fg">
            {last.value}
            <span className="ml-1 text-[17px] font-semibold tracking-normal text-muted">{unit}</span>
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 pb-0.5">
          {note}
          <span className="text-[13px] text-muted">{shortDate(last.date)}</span>
        </div>
      </div>
      {points.length >= 2 ? <MetricChart points={points} unit={chartUnit} /> : null}
    </section>
  );
}

// One tape measurement in the Measurements list: latest value, and how it
// has moved since the first time it was logged.
function MeasureRow({ label, points, expandable }) {
  const first = points[0];
  const last = points[points.length - 1];
  const delta = Math.round((last.value - first.value) * 10) / 10;
  const sub =
    points.length < 2
      ? `Logged ${shortDate(last.date)}`
      : delta === 0
        ? `No change since ${shortDate(first.date)}`
        : `${delta > 0 ? "+" : ""}${delta} cm since ${shortDate(first.date)}`;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[16px] text-fg">{label}</span>
        <span className="truncate text-[13px] text-muted tabular-nums">{sub}</span>
      </span>
      <span className="tabular shrink-0 text-[17px] font-semibold text-fg">
        {last.value}
        <span className="ml-1 text-[13px] font-medium text-muted">cm</span>
      </span>
      {expandable ? (
        <IconChevron className="h-4 w-4 shrink-0 text-dim transition-transform group-open/m:rotate-90" />
      ) : (
        <span className="w-4 shrink-0" />
      )}
    </div>
  );
}

function BodySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-14 rounded-2xl skeleton bg-surface-2" />
      <div className="h-56 rounded-2xl skeleton bg-surface-2" />
      <div className="h-64 rounded-2xl skeleton bg-surface-2" />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/menu"
      className="-ml-1 mb-1 flex items-center gap-0.5 self-start py-1 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
      Menu
    </Link>
  );
}

function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function IconScale(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8.5 9.5a5 5 0 0 1 7 0" />
      <path d="m12 12 1.5-2.5" />
    </svg>
  );
}
